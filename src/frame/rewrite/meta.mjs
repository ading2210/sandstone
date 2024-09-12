import { ctx, convert_url } from "../context.mjs";
import * as loader from "../loader.mjs";

export function rewrite_meta(html) {
  let meta_elements = html.querySelectorAll("meta[http-equiv='refresh']");

  for (let i = 0; i < meta_elements.length; i++) {
    let meta_element = meta_elements[i];
    meta_element.setAttribute("http-equiv", "");
    let content = meta_element.getAttribute("content");
    if (!content) continue;

    //regex that splits out time and url of the refresh header
    let content_regex = /(\d+)([;,] url=['"]?(.+?)['"]?)?$/im;
    let [match, timeout, _, url] = content.match(content_regex);
    if (!timeout || !match) continue;
    if (!url) url = "/"
    
    //do the navigation
    url = convert_url(url, ctx.location.href);
    setTimeout(() => {
      loader.navigate(loader.frame_id, url);
    }, parseInt(timeout));
  }
}