import * as rpc from "../rpc.mjs";
import * as rewrite from "./rewrite/index.mjs";
import * as network from "./network.mjs";

import { custom_document } from "./intercept/document.mjs";
import { update_ctx, run_script, run_script_safe, ctx, safe_script_template, wrap_obj, convert_url } from "./context.mjs";
import { should_load, pending_scripts } from "./rewrite/script.mjs";

export const navigate = rpc.create_rpc_wrapper(rpc.host, "navigate");
export const local_storage = rpc.create_rpc_wrapper(rpc.host, "local_storage");

export const runtime_src = self.document?.currentScript?.innerHTML;
export let url; //the proxied page url
export let frame_id; //the current frame id
export let is_loaded = false;

function evaluate_scripts() {
  let script_elements = document.getElementsByTagName("script");
  let script_strings = [];

  for (let i = 0; i < script_elements.length; i++) {
    let script_element = script_elements[i];

    if (script_element.hasAttribute("__script_id")) {
      let script_id = script_element.getAttribute("__script_id");
      script_strings.push([script_id, pending_scripts[script_id]]);
      delete pending_scripts[script_id];
    }
    else if (should_load(script_element)) {
      script_strings.push([script_id, script_element.innerHTML]);
    }
  }
  
  let wrapped_scripts = [];
  for (let [script_id, script] of script_strings) {
    let script_part = `
      document.currentScript = document.querySelector("script[__script_id='${script_id}']");
      ${safe_script_template(script)}
      document.currentScript = null;
    `;
    wrapped_scripts.push(script_part);
  }
  run_script(wrapped_scripts.join("\n\n"));
}

export function set_frame_id(id) {
  frame_id = id;
}
export function set_url(_url) {
  url = _url;
}

async function load_html(options) {
  //rpc.attach_host(new MessageChannel());

  network.known_urls[location.href] = options.url;
  network.enable_network();
  set_url(options.url);
  set_frame_id(options.frame_id);
  update_ctx();

  if (options.error) {
    document.getElementById("loading_text").style.display = "none";
    document.getElementById("error_div").style.display = "initial";
    document.getElementById("error_msg").innerText = options.error;
    document.getElementById("version_text").innerText = `Sandstone v${options.version.ver} (${options.version.hash})`;
    return;
  }

  //load local storage
  if (options.local_storage) {
    for (let [key, value] of options.local_storage) {
      ctx.localStorage.setItem(key, value);
    }
  }

  let parser = new DOMParser();
  let html = parser.parseFromString(options.html, "text/html");  
  
  //rewrite all html elements
  await rewrite.element(html.documentElement);

  //add handler for navigation
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented) return;
    let element = event.target;
    while (element && !(element instanceof HTMLAnchorElement)) {
      element = element.parentElement;
    }
    if (!element) return;
    
    let original_href = convert_url(element.href, ctx.location.href);
    navigate(frame_id, original_href);
    event.preventDefault();
    event.stopImmediatePropagation();
  });

  //parse elements with ids and add them to the scope
  let id_elements = html.querySelectorAll("*[id]");
  let ctx_proto = Object.getPrototypeOf(ctx);
  for (let i = 0; i < id_elements.length; i++) {
    let element = id_elements[i];
    if (ctx_proto.hasOwnProperty(element.id)) continue;
    ctx[element.id] = element;
  }

  //apply the rewritten html
  console.log("done downloading page");
  document.documentElement.replaceWith(html.documentElement);
  wrap_obj(custom_document, document);
  evaluate_scripts();

  //trigger load events
  is_loaded = true;
  ctx.document.dispatchEvent(new Event("DOMContentLoaded"));
  ctx.document.dispatchEvent(new Event("load"));
  ctx.dispatchEvent(new Event("load"));
}

async function get_favicon() {
  var favicon_url = "/favicon.ico";
  var link_elements = document.getElementsByTagName("link");
  for (var i = 0; i < link_elements.length; i++) {
    let link = link_elements[i];
    if (link.getAttribute("rel") === "icon") 
      favicon_url = link.getAttribute("href");
    if (link.getAttribute("rel") === "shortcut icon") 
      favicon_url = link.getAttribute("href");
  }

  let response = await network.fetch(favicon_url);
  if (!response.ok) return null;
  return await response.blob();
}

function external_eval(js) {
  run_script_safe(js);
}

rpc.rpc_handlers["html"] = load_html;
rpc.rpc_handlers["favicon"] = get_favicon;
rpc.rpc_handlers["eval"] = external_eval;