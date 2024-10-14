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
