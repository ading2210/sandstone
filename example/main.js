let from_id = (id) => document.getElementById(id);

let main_frame = new proxy_host.controller.ProxyFrame();

async function navigate_clicked() {
  let url = from_id("url_box").value;
  await main_frame.navigate_to(url);
}

function main() {
  libcurl.set_websocket(location.href.replace("http", "ws"));

  from_id("navigate_button").onclick = navigate_clicked;
  from_id("frame_container").append(main_frame.iframe);
}

window.onload = main;