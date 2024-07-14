import { ctx, convert_url } from "../context.mjs";
import * as loader from "../loader.mjs";

export function rewrite_anchor(html) {
  let anchor_elements = html.querySelectorAll("a[href]");

  for (let i = 0; i < anchor_elements.length; i++) {
    let anchor_element = anchor_elements[i];
    let original_href = convert_url(anchor_element.href, ctx.location.href);

    anchor_element.addEventListener("click", (event) => {
      loader.navigate(loader.frame_id, original_href)
      event.preventDefault();
      event.stopImmediatePropagation();
    })
  }
}