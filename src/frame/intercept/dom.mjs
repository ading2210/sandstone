import * as rewrite from "../rewrite/index.mjs";
import { proxy_function } from "../context.mjs";

function handle_append(element) {
  if (element instanceof HTMLScriptElement) 
    rewrite.script(element);
  else if (element instanceof HTMLLinkElement && element.rel.includes("stylesheet")) 
    rewrite.stylesheet(element);
}

proxy_function(globalThis?.HTMLElement?.prototype, "append", (target, this_arg, args) => {
  handle_append(args[0]);
  return Reflect.apply(target, this_arg, args);
})

proxy_function(globalThis?.HTMLElement?.prototype, "appendChild", (target, this_arg, args) => {
  handle_append(args[0]);
  return Reflect.apply(target, this_arg, args);
})

proxy_function(globalThis?.HTMLElement?.prototype, "insertBefore", (target, this_arg, args) => {
  handle_append(args[0]);
  return Reflect.apply(target, this_arg, args);
})

proxy_function(globalThis?.HTMLElement?.prototype, "replaceChild", (target, this_arg, args) => {
  handle_append(args[0]);
  return Reflect.apply(target, this_arg, args);
})
