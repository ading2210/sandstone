import { ctx } from "../context.mjs";

const internal = {
  currentScript: null
}

class CustomDocument {
  get cookie() {return ""}
  set cookie(value) {}
  get body() {return this.__target__.body}
  get location() {return ctx.location}
  get URL() {return ctx.location.href}
  get currentScript() {return internal.currentScript}
  set currentScript(value) {internal.currentScript = value}

  createElement(tag_name, options) {
    return this.__target__.createElement(tag_name, options);
  }
}

export const custom_document = new CustomDocument();