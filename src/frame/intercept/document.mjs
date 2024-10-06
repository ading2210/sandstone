import { ctx } from "../context.mjs";

class CustomDocument {
  get cookie() {return ""}
  get body() {return this.__target__.body}
  get location() {return ctx.location}
  get URL() {return ctx.location.href}

  createElement(tag_name, options) {
    return this.__target__.createElement(tag_name, options);
  }
}

export const custom_document = new CustomDocument();