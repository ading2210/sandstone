import { iframes } from "./controller.mjs";
import { rpc_handlers } from "../rpc.mjs";
import { libcurl } from "libcurl.js/bundled";

export const ws_connections = {};
export let session = null;

export function set_websocket(url) {
  libcurl.set_websocket(url);
}

function get_ws(frame_id, ws_id) {
  let frame_websockets = ws_connections[frame_id];
  if (!frame_websockets) return;
  return frame_websockets[ws_id];
}

//handle fetch api requests
rpc_handlers["fetch"] = async function(url, options) {
  var response = await session.fetch(url, options);
  var keys = ["ok", "redirected", "status", "statusText", "type", "url", "raw_headers"];
  var payload = {
    body: await response.blob(),
    headers: [],
    items: {}
  };  
  if (payload.body.type.includes(";")) {
    let mime_type = payload.body.type.split(";")[0].trim();
    payload.body = new Blob([payload.body], {type: mime_type});
  }
  for (let key of keys) {
    payload.items[key] = response[key];
  }
  for (let pair of response.headers.entries()) {
    payload.headers.push(pair);
  }

  return payload
}

//handle websocket creation 
rpc_handlers["ws_new"] = function (frame_id, url, protocols, options) {
  let ws_id = Math.random() + "";
  let ws = new libcurl.CurlWebSocket(url, protocols, options);
  let ws_events = [];

  if (!ws_connections[frame_id]) ws_connections[frame_id] = {};
  ws_connections[frame_id][ws_id] = {
    ws: ws,
    events: ws_events,
    callback: null
  };
  let ws_info = ws_connections[frame_id][ws_id];
  
  //set up event listeners to forward to the frame
  for (let event_name of ["open", "message", "close", "error"]) {
    ws["on" + event_name] = (data) => {
      ws_info.events.push([event_name, data]);
      ws_info.callback?.();
    }
  }

  //make sure ws is closed automatically
  let close_callback = ws.onclose;
  ws.onclose = (reason) => {
    close_callback(reason);
    ws.close();
  }
  
  return ws_id;
}

//the frame will call this repeatedly to poll for new events
rpc_handlers["ws_event"] = function (frame_id, ws_id) {
  let ws_info = get_ws(frame_id, ws_id);
  if (!ws_info) return null;
  if (ws_info.events.length > 0) {
    let ws_events = ws_info.events;
    ws_info.events = [];
    return ws_events;
  }
    
  return new Promise((resolve) => {
    ws_info.callback = () => {
      resolve(ws_info.events);
      ws_info.events = [];
      ws_info.callback = null;
    }
  })
}

rpc_handlers["ws_send"] = function (frame_id, ws_id, data) {
  let ws_info = get_ws(frame_id, ws_id);
  if (!ws_info) return;
  ws_info.ws.send(data);
}

rpc_handlers["ws_close"] = function (frame_id, ws_id) {
  let ws_info = get_ws(frame_id, ws_id);
  if (!ws_info) return;
  delete ws_connections[frame_id][ws_id];
  ws_info.ws.close();
}

//when navigating to a new page we need to close unused connections
export function clean_ws_connections(id_to_clean) {
  let frame_ids = Object.keys(iframes);
  
  for (let [frame_id, frame_websockets] of Object.entries(ws_connections)) {
    if (frame_ids.includes(frame_id) && frame_id !== id_to_clean) continue;
    
    for (let [ws_id, ws_info] of Object.entries(frame_websockets)) {
      delete ws_connections[frame_id][ws_id];
      ws_info.ws.close();
    }
    
    delete ws_connections[frame_id];
  }
}

libcurl.events.addEventListener("libcurl_load", () => {
  console.log(`libcurl.js v${libcurl.version.lib} loaded`);
  session = new libcurl.HTTPSession({enable_cookies: true})
});
