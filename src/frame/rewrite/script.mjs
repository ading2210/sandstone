import * as network from "../network.mjs";
import * as loader from "../loader.mjs";
import * as parser from "../parser.mjs";

import { ctx, run_script_safe, convert_url, intercept_property } from "../context.mjs";

export const pending_scripts = {};

export function should_load(element) {
  if (!element.type || element.type === "application/javascript" || element.type === "text/javascript") 
    return true;
  return false;
}

export async function rewrite_script(script_element) {
  if (!should_load(script_element)) {
    return;
  }

  let script_text = script_element.innerHTML; 
  let script_url = script_element.src;
  let src_descriptor = intercept_property(script_element, "src", {
    get: () => {
      return script_url;
    },
    set: async (value) => {
      script_url = value;
      await download_src();
      run_script();
    }
  });
  script_element.removeAttribute("src");

  async function download_src() {
    script_element.setAttribute("__src", script_url);
    let src_url = convert_url(script_url, ctx.location.href);
    let response = await network.fetch(src_url);
    script_text = await response.text();
  }

  function run_script() {
    ctx.document.currentScript = script_element;
    let rewritten_js = parser.rewrite_js(script_text);
    run_script_safe(rewritten_js);
    ctx.document.currentScript = null;
    script_element.dispatchEvent(new Event("load"));
  }

  if (script_url) {
    await download_src();
  }

  if (loader.is_loaded) {
    run_script();
  }
  else {
    let script_id = "" + Math.random();
    script_element.setAttribute("__script_id", script_id);
    pending_scripts[script_id] = script_text;
  }
}
