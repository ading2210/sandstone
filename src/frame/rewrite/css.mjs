import * as util from "../../util.mjs";
import * as network from "../network.mjs";
import { convert_url } from "../context.mjs";

//css @import not supported yet
export async function parse_css(css_str, css_url) {
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
    
    let new_url = network.create_blob_url(blobs[url], url);
    count++;
    return `url("${new_url}")`;
  });
  return css_str;
}
