import * as polyfill from "./polyfill/index.mjs";
import * as intercept from "./intercept/index.mjs";

const internal = {
  location: null,
  self: null,
  globalThis: null,
  eval: null
};

/*
export const ctx = new Proxy(window, {
  get(target, property) {
    if (property === "location")
      return internal.location;
    else if (property === "self")
      return internal.self;
    else if (property === "globalThis")
      return internal.globalThis;
    else if (property === "window")
      return ctx;
    else if (property === "location")
      return ctx.location;
    else if (property === "origin") 
      return ctx.location.origin

    return Reflect.get(target, property);
  },

  set(target, property, value) {

  }
})*/

class CustomCTX {
  set location(value) {internal.location.assign(value)}
  get location() {return internal.location}

  set self(value) {internal.self = value}
  get self() {return internal.self}
  set globalThis(value) {internal.globalThis = value}
  get globalThis() {return internal.globalThis}

  get window() {return this}
  get origin() {return this.location.origin}
  get document() {return intercept.document} 

  fetch() {return polyfill.fetch(...arguments)}
}

export const ctx = new CustomCTX();

export function wrap_function(key, wrapper, target) {
  wrapper[key] = new Proxy(target[key], {
    apply: function(func_target, this_arg, arguments_list) {
      return Reflect.apply(func_target, target, arguments_list);
    }
  });
  /*
  let hidden_sym = Symbol();
  let func = target[key];
  wrapper[key] = function() {
    if (this && this[hidden_sym]) return new func(...arguments);
    return func(...arguments);
  }
  Object.setPrototypeOf(wrapper[key], func);
  if (func.prototype) wrapper[key].prototype = func.prototype;
  wrapper[key].prototype[hidden_sym] = true; 
  */
}

export function wrap_obj(wrapper, target) {
  console.log(wrapper, target); 
  let wrapper_proto = Object.getPrototypeOf(wrapper);
  let target_keys = Reflect.ownKeys(target);
  let target_proto = Object.getPrototypeOf(target);
  while (target_proto != null) {
    target_keys.push(...Reflect.ownKeys(target_proto));
    target_proto = Object.getPrototypeOf(target_proto);
  }

  let exclude = ["RegExp", "eval"];
  for (let key of target_keys) {
    if (wrapper_proto.hasOwnProperty(key)) continue;
    if (key === "__proto__") continue;
    if (exclude.includes(key)) continue;
    try {
      if (typeof target[key] === "function") {
        wrap_function(key, wrapper, target);
        continue;
      }
      wrapper[key] = target[key];
    }
    catch (e) {
      if (e instanceof DOMException) continue;
      console.error(key, e);
    }
  }
}

export function update_ctx() {
  internal.location = new polyfill.FakeLocation();
  internal.self = ctx;
  internal.globalThis = ctx;

  //wrap function calls
  wrap_obj(ctx, window);
  delete ctx.eval;

  //wrap window events
  for (let key of Reflect.ownKeys(window)) {
    if (!key.startsWith("on")) continue;
    Object.defineProperty(ctx, key, {
      get: () => {return window[key]},
      set: (value) => {window[key] = value}
    });
  }
}

export function convert_url(url, base) {
  let url_obj = new URL(url, base);
  return url_obj.href;
}

export function run_script(js, this_obj=ctx) {
  return Reflect.apply(Function("globalThis", `
    with (globalThis) {
      ${js}
    }
  `), this_obj, [ctx]);
}