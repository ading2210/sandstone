import * as sandstone from "../dist/sandstone.mjs";
import resources from "./resources/index.mjs";

const from_id = (id) => document.getElementById(id);

const favicon_img = from_id("favicon_img");
const favicon_text = from_id("favicon_text");
const navigate_button = from_id("navigate_button");
const url_box = from_id("url_box");
const frame_container = from_id("frame_container");
const version_text = from_id("version_text");
const options_button = from_id("options_button");
const options_div = from_id("options_div");
const wisp_url_input = from_id("wisp_url_input");
const close_options_button = from_id("close_options_button");
const eval_js_input = from_id("eval_js_input");
const eval_js_button = from_id("eval_js_button");

const main_frame = new sandstone.controller.ProxyFrame();
globalThis.sandstone = sandstone;
globalThis.main_frame = main_frame;

main_frame.special_pages = {
  "sandstone://home": null,
};

main_frame.on_navigate = () => {
  url_box.value = main_frame.url.href;
  favicon_img.style.display = "none";
  favicon_text.style.display = "initial";
}

main_frame.on_load = async () => {
  url_box.value = main_frame.url.href;
  let favicon_url = await main_frame.get_favicon();
  if (!favicon_url.startsWith("data:")) {
    let response = await sandstone.libcurl.fetch(favicon_url);
    if (!response.ok) return;
    let favicon = await response.blob();
    favicon_url = URL.createObjectURL(favicon);
  }
  favicon_img.src = favicon_url;
  favicon_img.style.display = "initial";
  favicon_text.style.display = "none";  
}

main_frame.on_url_change = () => {
  url_box.value = main_frame.url.href;
}

async function navigate_clicked() {
  let url = url_box.value;
  if (!url.startsWith("http:") && !url.startsWith("https:") && !url.startsWith("sandstone:")) 
    url_box.value = "https://" + url;
  await main_frame.navigate_to(url_box.value);
}

function toggle_options() {
  options_div.style.display = options_div.style.display === "none" ? "flex" : "none";
  frame_container.style.filter = frame_container.style.filter ? "" : "brightness(50%)";
  
  //apply options
  sandstone.libcurl.set_websocket(wisp_url_input.value);
}

async function create_homepage() {
  let parser = new DOMParser();
  let html = parser.parseFromString(resources["home.html"], "text/html");

  let icon_element = document.querySelector("link[rel='icon']");
  let icon_url = icon_element.href;

  if (!icon_url.startsWith("data:")) {
    let response = await fetch(icon_url);
    let icon_blob = await response.blob();
    icon_url = await new Promise((resolve) => {
      var reader = new FileReader();
      reader.onload = (event) => {resolve(event.target.result)}
      reader.readAsDataURL(icon_blob);
    });
  }

  html.querySelector("link[rel='icon']").href = icon_url;
  html.getElementById("main_img").src = icon_url;
  html.getElementById("sandstone_version").textContent = version_text.textContent;

  let homepage_html = "<!DOCTYPE html>" + html.documentElement.outerHTML;
  main_frame.special_pages["sandstone://home"] = homepage_html;
}

async function main() {
  if (location.hash)
    url_box.value = location.hash.substring(1);

  let wisp_url = "wss://wisp.mercurywork.shop/";
  if (location.hostname.endsWith(".pages.dev") || (location.protocol !== "http:" && location.protocol !== "https:")) 
    sandstone.libcurl.set_websocket(wisp_url);
  else {
    wisp_url = location.origin.replace("http", "ws");
    sandstone.libcurl.set_websocket(wisp_url);
  }

  version_text.textContent = `v${sandstone.version.ver} (${sandstone.version.hash})`;
  wisp_url_input.value = wisp_url;
  options_button.onclick = toggle_options;
  close_options_button.onclick = toggle_options;
  document.body.onkeydown = (event) => {
    if (event.key !== "Escape") return;
    if (options_div.style.display === "none") return;
    toggle_options();
  }

  eval_js_button.onclick = () => {
    main_frame.eval_js(eval_js_input.value);
  }

  await create_homepage();
  
  navigate_button.onclick = navigate_clicked;
  url_box.onkeydown = (event) => {
    if (event.code === "Enter") {
      navigate_clicked();
    }
  }
  frame_container.append(main_frame.iframe);
  await navigate_clicked();

  frame_container.style.backgroundColor = "unset";
}

main();