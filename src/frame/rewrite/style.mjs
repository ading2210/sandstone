import { ctx } from "../context.mjs";
import { parse_css } from "./css.mjs";

export async function rewrite_style(style_element) {
  let css = style_element.innerHTML;
  style_element.innerHTML = await parse_css(css, ctx.location.href);
}
