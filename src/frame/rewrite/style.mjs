import * as util from "../../util.mjs";
import { ctx } from "../context.mjs";
import { parse_css } from "./css.mjs";

export async function rewrite_style(style_element) {
  let css = style_element.innerHTML;
  style_element.innerHTML = await parse_css(css, ctx.location.href);
}

export async function rewrite_all_styles(html) {
  let style_elements = html.getElementsByTagName("style");
  let style_promises = [...style_elements].map((element) => {
    return rewrite_style(element);
  });
  
  let inline_styles = html.querySelectorAll("*[style]");
  for (let i = 0; i < inline_styles.length; i++) {
    let element = inline_styles[i]; 
    let css = element.getAttribute("style");
    style_promises.push((async () => {
      css = await parse_css(css, ctx.location.href);
      element.setAttribute("style", css);
    })());
  }

  await util.run_parallel(style_promises);
}