import { rpc_handlers } from "../rpc.mjs";
import { libcurl } from "libcurl.js/bundled";

export function set_websocket(url) {
  libcurl.set_websocket(url);
}

rpc_handlers["fetch"] = async function(url, options) {
  let response = await libcurl.fetch(url, options);
  let keys = ["ok", "redirected", "status", "statusText", "type", "url", "raw_headers"];
  let payload = {
    body: await response.blob(),
    headers: [],
    items: {}
  };
  for (let key of keys) {
    payload.items[key] = response[key];
  }
  for (let pair of response.headers.entries()) {
    payload.headers.push(pair);
  }

  return payload
}

libcurl.events.addEventListener("libcurl_load", () => {
  console.log(`libcurl.js v${libcurl.version.lib} loaded`);
});
