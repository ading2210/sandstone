let from_id = (id) => document.getElementById(id);

let favicon_img = from_id("favicon_img");
let favicon_text = from_id("favicon_text");
let navigate_button = from_id("navigate_button");
let url_box = from_id("url_box");
let frame_container = from_id("frame_container");

let main_frame = new sandstone.controller.ProxyFrame();

main_frame.on_navigate = () => {
  url_box.value = main_frame.url.href;
  favicon_img.style.display = "none";
  favicon_text.style.display = "initial";
}

main_frame.on_load = async () => {
  url_box.value = main_frame.url.href;
  let favicon = await main_frame.get_favicon();
  if (favicon === null) return;
  favicon_img.src = URL.createObjectURL(favicon);
  favicon_img.style.display = "initial";
  favicon_text.style.display = "none";  
}

main_frame.on_url_change = () => {
  url_box.value = main_frame.url.href;
}

async function navigate_clicked() {
  if (!url_box.value.startsWith("http:") && !url_box.value.startsWith("https:")) 
    url_box.value = "https://" + url_box.value;
  await main_frame.navigate_to(url_box.value);
}

async function main() {
  if (location.hash)
    url_box.value = location.hash.substring(1);

  if (location.protocol !== "http:" && location.protocol !== "https:") 
    sandstone.libcurl.set_websocket("wss://wisp.mercurywork.shop/");
  else {
    let ws_url = new URL(location.href);
    ws_url.protocol = "wss:";
    sandstone.libcurl.set_websocket(ws_url.origin);
  }
    
  
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