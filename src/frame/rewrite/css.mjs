import * as util from "../../util.mjs";
import * as network from "../network.mjs";
import { convert_url } from "../context.mjs";

const url_regex = /url\(['"]?(.+?)['"]?\)/gm;

//css @import not supported yet
export function parse_css(css_str, css_url) {
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

  if (!requests) {
    return replace_blobs(css_str, {});
  }
  return (async () => {
    let url_contents = await util.run_parallel(Object.values(requests));
    url_contents = url_contents.filter(item => item); //some requests may have failed
    if (!url_contents) return replace_blobs(css_str, {});;
    let blobs = Object.fromEntries(url_contents);
    return replace_blobs(css_str, blobs);
  })();
}

function replace_blobs(css_str, blobs) {
  let count = 0;
  css_str = css_str.replaceAll(url_regex, (match, url) => {
    if (url.startsWith("data:") || url.startsWith("blob:")) {
      return match;
    }
    if (!blobs[url]) {
      return match;
    }
    
    let new_url = network.create_blob_url(blobs[url], url);
    count++;
    return `url("${new_url}")`;
  });
  return css_str;
}
