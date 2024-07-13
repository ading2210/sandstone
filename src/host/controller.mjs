import * as rpc from "../rpc.mjs";
import { libcurl } from "libcurl.js/bundled";

import frame_js from "../../dist/frame.js";
let frame_url = null;

export const iframes = {};

function get_frame_bundle() {
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

export class ProxyFrame {
  constructor() {
    this.url = null;
    this.id = Math.random() + "";
    this.iframe = document.createElement("iframe");
    
    this.iframe.sandbox = "allow-scripts";
    this.iframe.setAttribute("frame-id", this.id);
    this.send_page = rpc.create_rpc_wrapper(this.iframe, "html");
  }

  async navigate_to(url) {
    this.url = url;
    this.iframe.src = await get_frame_bundle();

    await new Promise((resolve) => {
      this.iframe.onload = async () => {
        let response = await libcurl.fetch(url);
        let html = await response.text();
        await this.send_page({
          url: this.url,
          html: html
        });
        resolve();
      }
    });
  }
}