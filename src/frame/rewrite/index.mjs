export { rewrite_element as element } from "./element.mjs";

//synchronous rewriter functions - may run in the background during load
export { rewrite_media as media } from "./media.mjs";
export { rewrite_link as link } from "./link.mjs";
export { rewrite_meta as meta } from "./meta.mjs";
export { rewrite_noscript as noscript } from "./noscript.mjs";
export { rewrite_form as form } from "./form.mjs";
export { rewrite_iframe as iframe } from "./iframe.mjs";

//async rewriter functions - must wait for these during page load
export { rewrite_stylesheet as stylesheet } from "./stylesheet.mjs";
export { rewrite_style as style } from "./style.mjs";
export { rewrite_script as script } from "./script.mjs";