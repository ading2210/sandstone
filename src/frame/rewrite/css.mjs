import * as util from "../../util.mjs";
import * as network from "../network.mjs";
import { ctx, convert_url } from "../context.mjs";

//css @import not supported yet
async function parse_css(css_str, css_url) {
  let url_regex = /url\(['"]?(.+?)['"]?\)/gm;
  let matches = [...css_str.matchAll(url_regex)];
  if (!matches.length) {
    return css_str;
  }

  let requests = {};
  for (let match of matches) {
    let url = match[1];
    
    if (url.startsWith("data:") || url.startsWith("blob:"))
      continue;
    if (requests[url]) 
      continue;

    requests[url] = (async () => {
      let absolute_url = convert_url(url, css_url);
      let response = await network.fetch(absolute_url);
      return [url, await response.blob()];
    })();
  }

  let url_contents = await util.run_parallel(Object.values(requests));
  url_contents.filter(item => item); //some requests may have failed
  let blobs = Object.fromEntries(url_contents);

  let count = 0;
  css_str = css_str.replaceAll(url_regex, () => {
    let original = matches[count][0];
    let url = matches[count][1]
    if (url.startsWith("data:") || url.startsWith("blob:")) {
      return original;
    }
    
    let new_url = URL.createObjectURL(blobs[url]);
    count++;
    return `url("${new_url}")`;
  });
  return css_str;
}

export async function rewrite_css(html) {
  let css_links = html.querySelectorAll("link[rel='stylesheet']");

  let requests = [];
  for (let i = 0; i < css_links.length; i++) {
    let link_element = css_links[i];
    let link_href = link_element.href || link_element.getAttribute("data-href");
    if (!link_href) {
      continue;
    }

    let css_url = convert_url(link_href, ctx.location.href);
    requests.push((async () => {
      let response = await network.fetch(css_url);
      let css = await response.text();
      let new_css = await parse_css(css, css_url);
      let css_blob = new Blob([new_css], {type: "text/css"});
      let blob_url = URL.createObjectURL(css_blob);
      link_element.href = blob_url;
    })());
  }

  await util.run_parallel(requests);
}

export async function rewrite_styles(html) {
  let style_elements = html.getElementsByTagName("style");
  let style_promises = [];
  
  for (let i = 0; i < style_elements.length; i++) {
    let style_element = style_elements[i]; 
    let css = style_element.innerHTML;
    style_promises.push((async () => {
      style_element.innerHTML = await parse_css(css, ctx.location.href);
    })());
  }

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