import { site_settings } from "../loader.mjs";

export function rewrite_noscript(noscript_element) {
  if (!site_settings.allow_js)
    return;
  let comment = new Comment(noscript_element.innerHTML);
  noscript_element.innerHTML = "";
  noscript_element.append(comment);
}
