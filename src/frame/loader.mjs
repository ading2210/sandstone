import * as rpc from "../rpc.mjs";
import * as util from "../util.mjs";
import * as rewrite from "./rewrite/index.mjs";
import * as network from "./network.mjs";
import { update_ctx, run_script, ctx } from "./context.mjs";
import { should_load, pending_scripts } from "./rewrite/script.mjs";

export const navigate = rpc.create_rpc_wrapper(parent, "navigate");
export let url;
export let frame_id;

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
    wrapped_scripts.push(`
      try {
        ${script}
      }
      catch (__e__) {
        console.error(__e__);
      }
    `)
  }
  run_script(wrapped_scripts.join("\n\n"));
  
  
  /*
  for (let script of script_strings) {
    try {
      run_script(script);
    }
    catch (e) {
      console.error(e);
    }
  }
  */
}

async function load_html(options) {
  url = options.url;
  frame_id = options.frame_id;
  update_ctx();

  let parser = new DOMParser();
  let html = parser.parseFromString(options.html, "text/html");  
  
  //these run synchronously
  rewrite.anchor(html);
  rewrite.link(html);
  
  //run the async ones in parallel
  await util.run_parallel([
    rewrite.css(html),
    rewrite.style(html),
    rewrite.media(html),
    rewrite.script(html)
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
  evaluate_scripts();

  //trigger load events
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