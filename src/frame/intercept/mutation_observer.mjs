import { ctx } from "../context.mjs";

if (typeof MutationObserver !== "undefined") {
  MutationObserver.prototype.observe = new Proxy(MutationObserver.prototype.observe, {
    apply: (target, this_arg, args) => {
      if (args[0] === ctx.document)
        args[0] = ctx.document.documentElement;
      return Reflect.apply(target, this_arg, args);
    }
  })
}