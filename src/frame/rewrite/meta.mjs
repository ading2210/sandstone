import { ctx, convert_url } from "../context.mjs";
import * as loader from "../loader.mjs";

export function rewrite_meta(meta_element) {
  if (!meta_element.getAttribute("http-equiv")) 
    return;
  if (meta_element.getAttribute("http-equiv") !== "refresh")
    return;

  meta_element.setAttribute("http-equiv", "");
  let content = meta_element.getAttribute("content");
  if (!content) return;

  //regex that splits out time and url of the refresh header
  let content_regex = /(\d+)([;,] ?url=['"]?(.+?)['"]?)?$/im;
  let matches = content.match(content_regex);
  let [match, timeout, _, url] = matches;
  if (!timeout || !match) return;
  if (!url) url = "/"
  
  //do the navigation
  url = convert_url(url, ctx.location.href);
  setTimeout(() => {
    loader.navigate(loader.frame_id, url);
  }, parseInt(timeout) * 1000);
}