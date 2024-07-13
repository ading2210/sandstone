import * as rpc from "../rpc.mjs";

export const rpc_fetch = rpc.create_rpc_wrapper(parent, "fetch");

export async function fetch(url, options) {
  let fetch_data = await rpc_fetch(url, options);
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