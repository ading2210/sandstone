import { ctx, wrap_obj } from "../context.mjs";

/*
export const document_proxy = new Proxy(document, {
  get(target, property) {
    if (property === "location")
      return ctx.location;
    if (property === "URL")
      return ctx.location.href;
    if (property === "baseURL")
      return ctx.location.href;
    if (property === "cookie")
      return "";
    
    return Reflect.get(target, property);
  }
})
*/


class CustomDocument {
  get cookie() {return ""}
}

export const custom_document = new CustomDocument();
wrap_obj(custom_document, document);