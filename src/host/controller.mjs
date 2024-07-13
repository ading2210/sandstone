import * as rpc from "../rpc.mjs";
import { libcurl } from "libcurl.js/bundled";

import frame_js from "../../dist/frame.js";
let frame_url = null;

export const iframes = {};

async function get_frame_bundle() {
  if (!frame_url) {
    let frame_html = `
      <!DOCTYPE html>
      <head>
        <script>${frame_js}</script>
      </head>
      <body>
      </body>
    `;
    let frame_blob = new Blob([frame_html]);
    frame_url = URL.createObjectURL(frame_blob);
  }
  return frame_url;
}

class ProxyFrame {
  constructor() {
    this.url = null;
    this.id = Math.random() + "";
    this.iframe = document.createElement("iframe");

    this.iframe.sandbox = "allow-scripts";
    this.iframe.setAttribute("frame-id", frame_id);
    this.send_page = rpc.create_rpc_wrapper(this.iframe, "html");
  }

  async navigate_to(url) {
    this.url = url;
    this.iframe.src = await get_frame_bundle();
    let html = await libcurl.fetch(url);

    await new Promise((resolve) => {
      iframe.onload = () => {
        this.send_page({
          url: this.url,
          html: html
        }).then(resolve);
      }
    });
  }
}

export async function create_iframe() {
  let iframe = document.createElement("iframe");
  let frame_id = Math.random()+"";
  iframe.sandbox = "allow-scripts";
  iframe.setAttribute("frame-id", frame_id);
  iframes[frame_id] = iframe;
  return iframe;
}