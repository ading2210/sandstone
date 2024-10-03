import * as util from "../../util.mjs";
import * as network from "../network.mjs";
import * as loader from "../loader.mjs";
import { ctx, run_script, run_script_safe, convert_url } from "../context.mjs";

export const pending_scripts = {};

export function should_load(element) {
  if (!element.type || element.type === "application/javascript") 
    return true;
  return false;
}

export async function rewrite_script(script_element) {
  if (!should_load(script_element)) {
    return;
  }

  let script_text = script_element.innerHTML; 

  if (script_element.src) {
    let src_url = convert_url(script_element.src, ctx.location.href);
    let response = await network.fetch(src_url);
    script_text = await response.text();
    script_element.setAttribute("__src", script_element.src);
  }

  if (loader.is_loaded) {
    run_script_safe(script_text);
    script_element.dispatchEvent(new Event("load"));
  }
  else {
    let script_id = "" + Math.random();
    script_element.setAttribute("__script_id", script_id);
    pending_scripts[script_id] = script_text;
  }
}

export async function rewrite_all_scripts(html) {
  //download all script elements with an src
  let script_elements = html.getElementsByTagName("script");
  let promises = [...script_elements].map((element) => {
    return rewrite_script(element);
  });

  //patch event handler attributes for all tags
  let all_elements = html.getElementsByTagName("*");
  for (let i = 0; i < all_elements.length; i++) {
    let element = all_elements[i];
    
    for (let j = 0; j < element.attributes.length; j++) {
      let attribute = element.attributes[j].name;
      if (!attribute.startsWith("on")) continue;
      let handler_script = element.getAttribute(attribute);
      let event_name = attribute.substring(2);

      element.setAttribute("__" + attribute, handler_script);
      element.removeAttribute(attribute);
      element.addEventListener(event_name, () => {
        run_script(handler_script, element);
      })
    }
  }

  await util.run_parallel(promises);
}