import { ctx, proxy_function, run_script_safe, convert_url } from "../context.mjs";
import { network } from "../index.mjs";

function handle_append_script(element) {
  console.log("DEBUG handle_append_script", element);
  if (element.src) {
    (async () => {
      let url = convert_url(element.src, ctx.location.href);
      let response = await network.fetch(url);
      let script_text = await response.text();
      run_script_safe(script_text);
      element.dispatchEvent(new Event("load"));
    })();
  }
  else {
    run_script_safe(element.innerHTML);
    element.dispatchEvent(new Event("load"));
  }
}

function handle_append_css(element) {
  console.log("DEBUG handle_append_css", element);
  if (element.href) {
    (async () => {
      let url = convert_url(element.href, ctx.location.href);
      let response = await network.fetch(url);
      let css_text = await response.text();
      
      let style = document.createElement("style");
      style.innerHTML = css_text;
      element.append(style);
      element.dispatchEvent(new Event("load"));
    })();
  }
}

proxy_function(globalThis?.HTMLElement?.prototype, "append", (target, this_arg, args) => {
  console.log("DEBUG HTMLElement.prototype.append", target, this_arg, args);
  let element = args[0];
  if (element instanceof HTMLScriptElement) 
    handle_append_script(element);
  else if (element instanceof HTMLLinkElement && element.rel.includes("stylesheet")) 
    handle_append_css(element);
  return Reflect.apply(target, this_arg, args);
})

proxy_function(globalThis?.HTMLElement?.prototype, "appendChild", (target, this_arg, args) => {
  console.log("DEBUG HTMLElement.prototype.appendChild", target, this_arg, args);
  let element = args[0];
  if (element instanceof HTMLScriptElement) 
    handle_append_script(element);
  else if (element instanceof HTMLLinkElement && element.rel.includes("stylesheet")) 
    handle_append_css(element);
  return Reflect.apply(target, this_arg, args);
})