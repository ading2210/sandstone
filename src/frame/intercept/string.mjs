import { ctx } from "../context.mjs";

//an awful hack to get youtube embeds to work
globalThis.String = new Proxy(globalThis.String, {
  apply(target, this_arg, args) {
    if (args[0] === location.href)
      args[0] = ctx.location.href;
    return Reflect.apply(target, this_arg, args);
  }
});
