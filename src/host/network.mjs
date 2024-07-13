import { rpc_handlers } from "../rpc.mjs";
import { libcurl } from "libcurl.js/bundled";

export function set_websocket(url) {
  libcurl.set_websocket(url);
}

rpc_handlers["fetch"] = function() {
  return libcurl.fetch(...arguments);
}

libcurl.onload = () => {
  console.log(`libcurl.js v${libcurl.version.lib} loaded`);
};
window.libcurl = libcurl;
