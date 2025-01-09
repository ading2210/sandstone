import * as rewrite from "./index.mjs";

import { parse_css } from "./css.mjs";
import { ctx, run_script } from "../context.mjs";

//non-recursive element rewrite
function rewrite_element_single(element) {
  //handlers for specific tags
  let promise;
  if (element.tagName === "NOSCRIPT")
    promise = rewrite.noscript(element);
  else if (element.matches("img, source, video, audio, input[type='image']"))
    promise = rewrite.media(element);
  else if (element instanceof HTMLLinkElement && element.rel !== "stylesheet")
    promise = rewrite.link(element);
  else if (element instanceof HTMLMetaElement)
    promise = rewrite.meta(element);
  else if (element instanceof HTMLLinkElement && element.rel === "stylesheet")
    promise = rewrite.stylesheet(element);
  else if (element instanceof HTMLStyleElement)
    promise = rewrite.style(element);
  else if (element instanceof HTMLScriptElement)
    promise = rewrite.script(element);
  else if (element instanceof HTMLFormElement)
    promise = rewrite.form(element);
  else if (element instanceof HTMLIFrameElement)
    promise = rewrite.iframe(element);
  let promises = [promise];

  //patch event handler attributes for all tags
  for (let j = 0; j < element.attributes.length; j++) {
    let attribute = element.attributes[j].name;
    if (!attribute.startsWith("on")) continue;
    let handler_script = element.getAttribute(attribute);
    let event_name = attribute.substring(2);

    element.setAttribute("__" + attribute, handler_script);
    element.removeAttribute(attribute);
    element.addEventListener(event_name, () => {
      run_script(handler_script, element);
    });
  }

  //rewrite inline styles
  let inline_style = element.getAttribute("style");
  if (inline_style) {
    element.style.cssText = "";
    let new_css = parse_css(inline_style, ctx.location.href)
    if (typeof new_css === "string") {
      element.style.cssText = new_css;
    }
    else {
      promises.push((async () => {
        element.style.cssText = await new_css;
      })());
    }
  }

  element.addEventListener("focus", () => {
    ctx.document.activeElement = element;
  })

  return promises;
}

//a recursive wrapper for rewriting an element and its descendants
export function rewrite_element(element) {
  if (!(element instanceof Element))
    return;

  let promises = [];
  if (!element.__rewritten__) {
    element.__rewritten__ = true;
    promises = rewrite_element_single(element);
  }
  
  //recursively rewrite children
  let children = [...element.children];
  for (let child of children) {
    promises.push(rewrite_element(child));
  }

  //if nothing returned a promise - then return synchronously
  promises = promises.filter((promise) => promise);
  if (!promises)
    return undefined;
  //otherwise we can let the caller wait for all promises to resolve
  return Promise.all(promises);
}
