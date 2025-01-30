import * as rpc from "../rpc.mjs";
import * as util from "../util.mjs";
import * as network from "./network.mjs";

import { version } from "./index.mjs";

import { libcurl } from "libcurl.js/bundled";

//frame_js is a string, which is imported using webpack
import frame_js from "../../dist/sandstone_frame.js";

let frame_url = null;
let frame_html = `
  <!DOCTYPE html>
  <head>
    <meta charset="utf-8">
    <script>${frame_js}</script>
    <style>
      html {
        background-color: #222222;
        font-family: sans-serif;
      }
      * {
        color: #dddddd;
      }
      #error_div {
        display: none;
      }
      #version_text {
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <p id="loading_text">Loading...</p>

    <div id="error_div">
      <h2>An unexpected error has occurred</h2>
      <pre id="error_msg">
      </pre>
      <p><i>
        <span id="version_text"></span>
      </p></i>
    </div>
  </body>
`;

export const iframes = {};
export const persist_storage_key = "proxy_local_storage";
export let local_storage = {};
try {
  local_storage = JSON.parse(localStorage.getItem(persist_storage_key)) || {};
}
catch {}

function get_frame_bundle() {
  if (!frame_url) {
    let frame_blob = new Blob([frame_html], {type: "text/html"});
    frame_url = URL.createObjectURL(frame_blob);
  }
  return frame_url;
}

export class ProxyFrame {
  constructor() {
    this.url = null;
    this.id = Math.random() + "";
    this.iframe = document.createElement("iframe");
    this.iframe.sandbox = "allow-scripts allow-forms allow-modals allow-pointer-lock";
    this.iframe.allowFullscreen = true;
    this.iframe.setAttribute("frame-id", this.id);

    iframes[this.id] = this;
    this.rpc_target = new rpc.RPCTarget();
    this.rpc_target.onmessage = rpc.message_listener;
    this.send_page = rpc.create_rpc_wrapper(this.rpc_target, "html");
    this.get_favicon = rpc.create_rpc_wrapper(this.rpc_target, "favicon");
    this.eval_js = rpc.create_rpc_wrapper(this.rpc_target, "eval");

    this.on_navigate = () => {};
    this.on_load = () => {};
    this.on_url_change = () => {};

    this.special_pages = {};
    this.site_settings = [];
    this.default_settings = {
      allow_js: true
    };
  }

  async wait_for_libcurl() {
    if (libcurl.ready) return;
    await libcurl.load_wasm();
  }

  async navigate_to(url, form_data=null) {
    await this.wait_for_libcurl();
    if (!util.is_valid_url(url)) {
      throw TypeError("Invalid URL");
    }

    console.log("navigating to", url);
    this.url = new URL(url);
    
    this.iframe.style.backgroundColor = "#222222";
    this.on_navigate();
    this.iframe.src = get_frame_bundle();
    network.clean_ws_connections(this.id);

    let html = null;
    let error = false;

    if (typeof this.special_pages[url] === "string") {
      html = this.special_pages[url];
    }
    else {
      try {
        let options = {};
        if (form_data) {
          console.log("placing post request:", form_data);
          options = {
            method: "POST",
            headers: {"Content-Type": form_data.enctype},
            body: form_data.body
          }
        }
        let response = await network.session.fetch(url, options);
        html = await response.text();
        url = response.url;
      }
      catch (e) {
        error = util.format_error(e);
      }  
    }
    this.url = new URL(url);
    
    let settings = this.site_settings.find((item) => {
      return item.hostname.test(this.url.hostname);
    }) || {};
    settings = {...this.default_settings, ...settings};
    console.log("site settings:", settings);

    await rpc.wait_on_frame(this.iframe);
    let msg_channel = new MessageChannel();
    this.rpc_target.set_target(msg_channel.port1);
    msg_channel.port1.start();
    await rpc.set_host(this.iframe, msg_channel.port2);

    try {
      await this.send_page({
        url: this.url.href,
        html: html, 
        frame_id: this.id,
        error: error,
        settings: settings,
        default_settings: this.default_settings,
        local_storage: local_storage[this.url.origin],
        version: version
      });
    }
    catch (e) {
      let error_msg = util.format_error(e);
      await this.send_page({
        url: this.url.href,
        html: html, 
        frame_id: this.id,
        error: error_msg,
        settings: settings,
        default_settings: this.default_settings,
        local_storage: undefined,
        version: version
      });
    }
    this.iframe.style.backgroundColor = "unset";
    this.on_load();
  }
}

rpc.rpc_handlers["navigate"] = async (frame_id, url, reload=true, form_data=null) => {
  let frame = iframes[frame_id];
  if (!frame) return;

  if (reload) {
    await frame.navigate_to(url, form_data);
  }
  else {
    frame.url = new URL(url);
    frame.on_url_change();
  }
}

rpc.rpc_handlers["local_storage"] = async (frame_id, entries) => {
  let frame = iframes[frame_id];
  if (!frame) return;
  local_storage[frame.url.origin] = entries;
  if (window.origin) {
    localStorage.setItem(persist_storage_key, JSON.stringify(local_storage));
  }
}

//this is for getting navigation events from form submission handlers
window.addEventListener("message", rpc.message_listener);