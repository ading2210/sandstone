import * as network from "./network.mjs";
import * as polyfill from "./polyfill/index.mjs";
import * as intercept from "./intercept/index.mjs";
import * as parser from "./parser.mjs";

export const is_worker = typeof importScripts === "function";
export const ctx_vars = [];
const internal = {
  location: null,
  self: null,
  globalThis: null,
  eval: null,
  history: null,
  localStorage: null,
  sessionStorage: null
};

function create_func_proxy(target, func) {
  let proxy = new Proxy(func, {
    apply: function(func_target, this_arg, args) {
      return Reflect.apply(func_target, target, args);
    }
  });
  proxy.apply = function(this_arg, args) {
    if (this_arg) this_arg = target
    return Reflect.apply(func, this_arg, args);
  }
  proxy.call = function(this_arg, ...args) {
    if (this_arg) this_arg = target
    return Reflect.apply(func, this_arg, args);
  }
  return proxy;
}

export function get_handler_keys(obj) {
  let keys = [];
  let own_keys = Reflect.ownKeys(Object.getPrototypeOf(obj));
  for (let key of own_keys) {
    if (key === "constructor") continue;
    if (key.startsWith("__")) continue;
    keys.push(key);
  }
  return keys;
}

export function create_obj_proxy(obj, ctx_vars, target) {
  return new Proxy(target, {
    get: (_, key) => {
      if (typeof obj[key] !== "undefined")
        return obj[key];
      if (typeof target[key] === "function" && !target[key].prototype) 
        return create_func_proxy(target, target[key]);
      return target[key];
    },
    set: (_, key, value) => {
      if (ctx_vars.includes(key))
        obj[key] = value;
      else
        target[key] = value;
      return true;
    }
  });
}

export class CustomCTX {
  constructor() {
    ctx_vars.push(...get_handler_keys(this));
    this.__proxy__ = create_obj_proxy(this, ctx_vars, globalThis);
  }

  set location(value) {internal.location.assign(value)}
  get location() {return internal.location}

  set self(value) {internal.self = value}
  get self() {return internal.self}
  set globalThis(value) {internal.globalThis = value}
  get globalThis() {return internal.globalThis}

  get window() {return this.__proxy__}
  get origin() {return this.location.origin}
  get document() {return is_worker ? undefined : intercept.document.__proxy__}
  get parent() {return this.__proxy__}
  get top() {return this.__proxy__}

  fetch() {return polyfill.fetch(...arguments)}
  get URL() {return polyfill.FakeURL}
  get Worker() {return polyfill.FakeWorker}
  get importScripts() {return is_worker ? polyfill.fakeImportScripts : undefined}
  get XMLHttpRequest() {return polyfill.FakeXMLHttpRequest}
  get history() {return internal.history}

  get localStorage() {return internal.localStorage}
  get sessionStorage() {return internal.sessionStorage}
  get WebSocket() {return network.WebSocket}

  __get_this__(this_obj) {
    if (this_obj === globalThis)
      return ctx.__proxy__;
    return this_obj;
  }
}

export const ctx = new CustomCTX();

export function proxy_function(target, key, apply_callback) {
  if (!target) return;
  target[key] = new Proxy(target[key], {apply: apply_callback});
}

export function wrap_function(key, wrapper, target) {
  wrapper[key] = new Proxy(target[key], {
    apply: function(func_target, this_arg, arguments_list) {
      return Reflect.apply(func_target, target, arguments_list);
    }
  });
}

export function wrap_obj(wrapper, target) {
  wrapper.__target__ = target;
  let wrapper_proto = Object.getPrototypeOf(wrapper);
  let target_keys = Reflect.ownKeys(target);
  let target_proto = Object.getPrototypeOf(target);
  while (target_proto != null) {
    target_keys.push(...Reflect.ownKeys(target_proto));
    target_proto = Object.getPrototypeOf(target_proto);
  }

  let exclude = ["eval"];
  for (let key of target_keys) {
    if (wrapper_proto.hasOwnProperty(key)) continue;
    if (key === "__proto__") continue;
    if (exclude.includes(key)) continue;
    try {
      if (typeof target[key] === "function") {
        wrap_function(key, wrapper, target);
        continue;
      }
      try {
        wrapper[key] = target[key];
      }
      catch {
        Object.defineProperty(wrapper, key, {
          configurable: true,
          value: target[key],
          writable: true
        })
      }
    }
    catch (e) {
      if (e instanceof DOMException) continue;
      if (e instanceof TypeError) continue;
    }
  }
}

export function update_ctx() {
  internal.location = new polyfill.FakeLocation();
  internal.self = ctx.__proxy__;
  internal.globalThis = ctx.__proxy__;
  internal.history = new polyfill.FakeHistory();
  internal.localStorage = new polyfill.FakeStorage("local");
  internal.sessionStorage = new polyfill.FakeStorage("session");
  delete globalThis.caches;

  /*
  console.error = new Proxy(console.error, {
    apply(target, this_arg, args) {
      let ret = Reflect.apply(target, this_arg, args);
      debugger;
      return ret;
    }
  })
  */
 
  //wrap function calls
  //wrap_obj(ctx, globalThis);
  /*
  delete ctx.eval;

  //wrap window events
  for (let key of Reflect.ownKeys(globalThis)) {
    if (!key.startsWith("on")) continue;
    Object.defineProperty(ctx, key, {
      get: () => {return globalThis[key]},
      set: (value) => {globalThis[key] = value}
    });
  }
  */

  globalThis.__ctx__ = ctx.__proxy__;
  globalThis.__get_this__ = ctx.__get_this__;
}

export function convert_url(url, base) {
  let url_obj = new URL(url, base);
  return url_obj.href;
}

export function safe_script_template(js) {
  return `
    try {
      (()=>{
        ${js}
      })();
    }
    catch (__e__) {
      console.error(__e__);
    }
  `;
}

export function run_script_safe(js) {
  try {
    run_script(js);
  }
  catch (e) {
    console.error(e);
  }
}

export function run_script(js) {
  //indirect eval preserves global variables
  let rewritten_js = parser.rewrite_js(js);
  if (!globalThis.document || !globalThis.document.body) {
    eval?.(rewritten_js);
    return;
  }
  try {
    let script = document.createElement("script");
    script.setAttribute("__no_rewrite__", "1");
    script.innerHTML = rewritten_js;
    document.body.append(script);
    script.remove();
  }
  catch (e) {
    if (e instanceof SyntaxError)
      console.error(e, rewritten_js);
    throw e;
  }
}

export function intercept_property(target, key, handler) {
  let descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), key);
  if (!descriptor) return;
  Object.defineProperty(target, key, handler);
  return descriptor;
}