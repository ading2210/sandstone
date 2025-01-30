import * as rpc from "../rpc.mjs";
import * as loader from "./loader.mjs";
import * as util from "../util.mjs";
import { ctx } from "./context.mjs";

export const rpc_fetch = rpc.create_rpc_wrapper(rpc.host, "fetch");
export const rpc_ws_new = rpc.create_rpc_wrapper(rpc.host, "ws_new");
export const rpc_ws_event = rpc.create_rpc_wrapper(rpc.host, "ws_event");
export const rpc_ws_send = rpc.create_rpc_wrapper(rpc.host, "ws_send");
export const rpc_ws_close = rpc.create_rpc_wrapper(rpc.host, "ws_close");

export const known_urls = {};
export const resource_cache = {};
export let requests_allowed = false;

export function enable_network(allowed=true) {
  requests_allowed = allowed;
}

export function cache_put(url, data) {
  resource_cache[url] = data; //put a blob into the cache
}

export async function fetch(url, options) {
  if (!requests_allowed) throw "Network request blocked";

  let base_url = ctx.location?.href || loader.url;
  url = new URL(url, base_url);
  if (url.protocol === "data:" || url.protocol === "blob:") {
    return await globalThis.fetch(url.href, options);
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

export class WebSocket extends EventTarget {
  #ws_id;

  constructor(url, protocols=[]) {
    super();

    let url_obj = new URL(url, ctx.location.href);
    url_obj.protocol = url_obj.protocol.replace("http", "ws");
    this.url = url_obj.href;
    this.protocols = protocols;
    this.binaryType = "blob";
    this.bufferedAmount = 0;

    //legacy event handlers
    this.onopen = () => {};
    this.onerror = () => {};
    this.onmessage = () => {};
    this.onclose = () => {};

    this.CONNECTING = 0;
    this.OPEN = 1;
    this.CLOSING = 2;
    this.CLOSED = 3;
    this.readyState = this.CONNECTING;

    this.#ws_id = null;
    this.#connect();
  }

  async #connect() {
    this.#ws_id = await rpc_ws_new(loader.frame_id, this.url, this.protocols, {
      headers: {
        "Origin": ctx.location.origin,
        "User-Agent": navigator.userAgent,
      }
    });
    this.#event_loop();
  }

  async #event_loop() {
    while (true) {
      let events = await rpc_ws_event(loader.frame_id, this.#ws_id);
      if (!events) break;
      for (let [event_name, data] of events) {
        this.#forward_event(event_name, data);
      }
    }
  }

  #forward_event(event_name, data) {
    if (event_name === "open") {
      this.readyState = this.OPEN;
      this.#dispatch_event(new Event("open"));
    }
    else if (event_name === "close") {
      this.readyState = this.CLOSED;
      this.#dispatch_event(new CloseEvent("close"));
    }
    else if (event_name === "message") {
      let converted;
      if (typeof data === "string")
        converted = data;
      else if (this.binaryType == "arraybuffer") 
        converted = data.buffer;
      else 
        converted = new Blob([data]);
      this.#dispatch_event(new MessageEvent("message", {data: converted}));
    }
    else if (event_name === "error") {
      this.#dispatch_event(new Event("error"));
    }
  }

  #dispatch_event(event) {
    try {
      this["on" + event.type](event);
    }
    catch (e) {
      console.error(e);
    }
    this.dispatchEvent(event);
  }

  send(data) {
    if (this.readyState === this.CONNECTING) {
      throw new DOMException("Websocket not ready yet.");
    }
    if (this.readyState === this.CLOSED) {
      return;
    }

    if (data instanceof Blob) {
      (async () => {
        let array_buffer = await data.arrayBuffer();
        this.send(new Uint8Array(array_buffer));
      })();
    }
    else if (typeof data === "string") {
      rpc_ws_send(loader.frame_id, this.#ws_id, data);
    }
    else {
      let converted = util.data_to_array(data);
      rpc_ws_send(loader.frame_id, this.#ws_id, converted);
    }
  }

  close() {
    this.readyState = this.CLOSING;
    rpc_ws_close(loader.frame_id, this.#ws_id);
  }
}