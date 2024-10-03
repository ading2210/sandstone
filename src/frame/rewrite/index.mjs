export { rewrite_element as element } from "./element.mjs";

//synchronous rewriter functions - may run in the background during load
export { 
  rewrite_anchor as anchor,
  rewrite_all_anchors as all_anchor } from "./anchor.mjs";
export { 
  rewrite_media as media,
  rewrite_all_media as all_media } from "./media.mjs";
export { 
  rewrite_link as link,
  rewrite_all_links as all_links } from "./link.mjs";
export { 
  rewrite_meta as meta,
  rewrite_all_meta as all_meta } from "./meta.mjs";
export { 
  rewrite_noscript as noscript,
  rewrite_all_noscript as all_noscript } from "./noscript.mjs";
export { 
  rewrite_form as form,
  rewrite_all_forms as all_forms } from "./form.mjs";  

//async rewriter functions - must wait for these during page load
export { 
  rewrite_stylesheet as stylesheet,
  rewrite_all_stylesheets as all_stylesheets } from "./stylesheet.mjs";
export { 
  rewrite_style as style,
  rewrite_all_styles as all_styles } from "./style.mjs";
export { 
  rewrite_script as script,
  rewrite_all_scripts as all_scripts } from "./script.mjs";