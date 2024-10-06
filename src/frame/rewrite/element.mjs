import * as rewrite from "./index.mjs";

export function rewrite_element(element) {
  if (!(element instanceof Element))
    return

  if (element instanceof HTMLAnchorElement)
    rewrite.anchor(element);
  else if (element.matches("img[src], source[src], img[srcset], source[srcset], video[src], audio[src]"))
    rewrite.media(element);
  else if (element instanceof HTMLLinkElement && element.rel !== "stylesheet")
    rewrite.link(element);
  else if (element instanceof HTMLMetaElement)
    rewrite.meta(element);
  else if (element.tagName === "noscript")
    rewrite.noscript(element);

  else if (element instanceof HTMLLinkElement && element.rel === "stylesheet")
    rewrite.stylesheet(element);
  else if (element instanceof HTMLStyleElement)
    rewrite.style(element);
  else if (element instanceof HTMLScriptElement)
    rewrite.script(element);

  for (let child of element.children) {
    rewrite.element(child);
  }
}