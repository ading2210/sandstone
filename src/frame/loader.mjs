import * as rpc from "../rpc.mjs";
import * as rewrite from "./rewrite/index.mjs";
import { update_ctx } from "./ctx.mjs";

export const navigate = rpc.create_rpc_wrapper(parent, "navigate");
export let url;
export let frame_id;

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
  await Promise.allSettled([
    rewrite.css(html),
    rewrite.style(html),
    rewrite.media(html)
  ]);

  //apply the rewritten html
  document.documentElement.replaceWith(html.documentElement);
}

rpc.rpc_handlers["html"] = load_html;