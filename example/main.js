let from_id = (id) => document.getElementById(id);

let favicon_img = from_id("favicon_img");
let favicon_text = from_id("favicon_text");
let navigate_button = from_id("navigate_button");
let url_box = from_id("url_box");
let frame_container = from_id("frame_container");

let main_frame = new proxy_host.controller.ProxyFrame();

main_frame.on_navigate = () => {
  url_box.value = main_frame.url;
  favicon_img.style.display = "none";
  favicon_text.style.display = "initial";
}

main_frame.on_load = async () => {
  url_box.value = main_frame.url;
  let favicon = await main_frame.get_favicon();
  if (favicon === null) return;
  favicon_img.src = URL.createObjectURL(favicon);
  favicon_img.style.display = "initial";
  favicon_text.style.display = "none";  
}

async function navigate_clicked() {
  await main_frame.navigate_to(url_box.value);
}

async function main() {
  if (location.protocol === "file:") 
    proxy_host.libcurl.set_websocket("wss://wisp.mercurywork.shop/");
  else 
    proxy_host.libcurl.set_websocket(location.href.replace("http", "ws"));
  
  navigate_button.onclick = navigate_clicked;
  url_box.onkeydown = (event) => {
    if (event.code === "Enter") {
      navigate_clicked();
    }
  }
  frame_container.append(main_frame.iframe);
  await navigate_clicked();
}

main();