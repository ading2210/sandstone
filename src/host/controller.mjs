import * as rpc from "../rpc.mjs";
import * as util from "../util.mjs";

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
        <style>
          html {
            background-color: #222222;
            font-family: sans-serif;
          }
          p {
            color: #dddddd;
          }
        </style>
      </head>
      <body>
        <p>Loading...</p>
      </body>
    `;
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
    
    this.iframe.sandbox = "allow-scripts";
    this.iframe.setAttribute("frame-id", this.id);
    this.send_page = rpc.create_rpc_wrapper(this.iframe, "html");

    iframes[this.id] = this;
  }

  async navigate_to(url) {
    if (!util.is_valid_url(url)) {
      throw TypeError("Invalid URL");
    }

    console.log("navigating to", url);
    this.url = url;
    this.iframe.src = await get_frame_bundle();

    let wait_for_load = () => {
      new Promise((resolve) => {
        this.iframe.onload = () => {
          resolve();
        }
      })
    }
    let download_html = async () => {
      let response = await libcurl.fetch(url);
      return await response.text();
    }

    let html = (await Promise.all([
      wait_for_load(),
      download_html()
    ]))[1];

    await this.send_page({
      url: this.url,
      html: html, 
      frame_id: this.id
    });
  }
}

rpc.rpc_handlers["navigate"] = async (frame_id, url) => {
  let frame = iframes[frame_id];
  if (!frame) return;

  await frame.navigate_to(url);
}