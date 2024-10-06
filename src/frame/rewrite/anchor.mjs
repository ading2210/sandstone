import { ctx, convert_url } from "../context.mjs";
import * as loader from "../loader.mjs";

export function rewrite_anchor(anchor_element) {}

export function rewrite_all_anchors(html) {
  document.addEventListener("click", (event) => {
    let element = event.target;
    while (element && !(element instanceof HTMLAnchorElement)) {
      element = element.parentElement;
    }
    if (!element) return;
    
    let original_href = convert_url(element.href, ctx.location.href);
    loader.navigate(loader.frame_id, original_href);
    event.preventDefault();
    event.stopImmediatePropagation();
  });
}