import { ctx, convert_url } from "../context.mjs";
import * as loader from "../loader.mjs";

function rewrite_refresh(meta_element) {
  meta_element.setAttribute("http-equiv", "__refresh");
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

function rewrite_csp(meta_element) {
  meta_element.setAttribute("http-equiv", "__content-security-policy");
}

export function rewrite_meta(meta_element) {
  let http_equiv = meta_element.getAttribute("http-equiv");
  if (!http_equiv) 
    return;
  http_equiv = http_equiv.trim().toLowerCase();

  if (http_equiv === "refresh")
    rewrite_refresh(meta_element);
  else if (http_equiv === "content-security-policy")
    rewrite_csp(meta_element);
}