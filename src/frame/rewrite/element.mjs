import * as rewrite from "./index.mjs";

export function rewrite_element(element) {
  if (element instanceof Text)
    return;
  else if (element instanceof HTMLAnchorElement)
    return rewrite.anchor(element);
  else if (element.matches("img[src], source[src], img[srcset], source[srcset], video[src], audio[src]"))
    return rewrite.media(element);
  else if (element instanceof HTMLLinkElement && element.rel !== "stylesheet")
    return rewrite.link(element);
  else if (element instanceof HTMLMetaElement)
    return rewrite.meta(element);
  else if (element.tagName === "noscript")
    return rewrite.noscript(element);

  else if (element instanceof HTMLLinkElement && element.rel === "stylesheet")
    return rewrite.stylesheet(element);
  else if (element instanceof HTMLStyleElement)
    return rewrite.style(element);
  else if (element instanceof HTMLScriptElement)
    return rewrite.script(element);
}