import * as rpc from "../rpc.mjs";
import * as loader from "./loader.mjs";
import { ctx } from "./context.mjs";

export const rpc_fetch = rpc.create_rpc_wrapper(parent, "fetch");

export const known_urls = {};

export async function fetch(url, options) {
  let base_url = ctx.location?.href || loader.url;
  url = new URL(url, base_url);
  if (url.protocol === "data:" || url.protocol === "blob:") {
    return await fetch(url.href, options);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw TypeError("Invalid URL");
  }

  let fetch_data = await rpc_fetch(url.href, options);
  let response = new Response(fetch_data.body);
  for (let key in fetch_data.items) {
    Object.defineProperty(response, key, {
      value: fetch_data.items[key]
    });
  }

  let headers = new Headers();
  for (let [key, value] of fetch_data.headers) {
    headers.append(key, value)
  }
  Object.defineProperty(response, "headers", {
    value: headers
  });

  return response;
};

export function create_blob_url(blob, target_url = null) {
  let url = URL.createObjectURL(blob);
  if (target_url)
    known_urls[url] = target_url;
  return url;
}