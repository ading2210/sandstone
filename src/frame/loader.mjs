import * as rpc from "../rpc.mjs";
import * as util from "../util.mjs";
import * as rewrite from "./rewrite/index.mjs";
import * as network from "./network.mjs";

import { custom_document } from "./intercept/document.mjs";
import { update_ctx, run_script, ctx, safe_script_template, wrap_obj } from "./context.mjs";
import { should_load, pending_scripts } from "./rewrite/script.mjs";

export const navigate = rpc.create_rpc_wrapper(rpc.parent, "navigate");
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
      script_strings.push(pending_scripts[script_id]);
      delete pending_scripts[script_id];
    }
    else if (should_load(script_element)) {
      script_strings.push(script_element.innerHTML);
    }
  }

  
  let wrapped_scripts = [];
  for (let script of script_strings) {
    wrapped_scripts.push(safe_script_template(script));
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
  network.known_urls[location.href] = options.url;
  network.enable_network();
  set_url(options.url);
  set_frame_id(options.frame_id);
  update_ctx();

  if (options.error) {
    document.getElementById("loading_text").style.display = "none";
    document.getElementById("error_div").style.display = "initial";
    document.getElementById("error_msg").innerText = options.error;
    return;
  }

  let parser = new DOMParser();
  let html = parser.parseFromString(options.html, "text/html");  
  
  //these run synchronously
  rewrite.all_noscript(html);
  rewrite.all_anchor(html);
  rewrite.all_links(html);
  rewrite.all_meta(html);
  rewrite.all_media(html);
  
  //run the async ones in parallel
  await util.run_parallel([
    rewrite.all_stylesheets(html),
    rewrite.all_styles(html),
    rewrite.all_scripts(html)
  ]);

  //parse elements with ids and add them to the scope
  let id_elements = html.querySelectorAll("*[id]");
  let ctx_proto = Object.getPrototypeOf(ctx);
  for (let i = 0; i < id_elements.length; i++) {
    let element = id_elements[i];
    if (ctx_proto.hasOwnProperty(element.id)) continue;
    ctx[element.id] = element;
  }

  //apply the rewritten html
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

rpc.rpc_handlers["html"] = load_html;
rpc.rpc_handlers["favicon"] = get_favicon;