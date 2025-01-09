import * as network from "../network.mjs";
import { ctx } from "../context.mjs";

export class FakeXMLHttpRequest extends EventTarget {
  UNSENT = 0;
  OPENED = 1;
  HEADERS_RECEIVED = 2;
  LOADING = 3;
  DONE = 4;

  #ready_state; //internal readystate value
  #response; //a response object 
  #response_data; //an arraybuffer containing the response data
  #mime_type; //internal mime type value
  #upload; //internal XMLHttpRequestUpload object
  #req_url; //internal store for request url
  #req_options; //internal request options dict
  #aborted;

  constructor() {
    super();
    console.log("DEBUG XHR.constructor", this);
    this.#init_internal();
    this.#mime_type = null;

    this.timeout = 0;
    this.responseType = "";
    this.withCredentials = false;
    
    this.#setup_listeners(["abort", "error", "load", "loadend", "loadstart", "progress", "readystatechange", "timeout"], this);
    this.#setup_listeners(["abort", "error", "load", "loadend", "loadstart", "progress", "timeout"], this.upload);
  }

  #setup_listeners(event_names, target) {
    for (let event_name of event_names) {
      target["on" + event_name] = null;
    }
  }

  #init_internal() {
    this.#ready_state = 0;
    this.#response = null;
    this.#response_data = null;
    this.#req_url = null;
    this.#req_options = {};
    this.#aborted = false;
    this.#upload = new EventTarget();
  }

  #emit_event(event, target) {
    if (!target) {
      this.#emit_event(event, this);
      this.#emit_event(event, this.#upload);
      return;
    }
    target.dispatchEvent(event);
    try {
      if (typeof target["on" + event.type] === "function")
        target["on" + event.type](event);  
    }
    catch (e) {
      console.error(e);
    }
  } 

  //note: we can't really abort requests through the rpc interface
  abort() {
    this.#aborted = true;
    this.readyState = this.UNSENT;
    this.#response = null;
    this.#emit_event(new Event("abort"));
    this.#emit_event(new Event("abort"), this.#upload);
  }

  getAllResponseHeaders() {
    if (!this.#response) return "";
    let result = "";
    for (let [key, value] of this.#response.headers) {
      result += `${key}: ${value}\r\n`;
    }
    return result;
  }

  getResponseHeader(header_name) {
    if (!this.#response) return "";
    return this.#response.headers.get(header_name);
  }

  open(method, url, async, user, password) {
    console.log("DEBUG XHR.open", this, method, url, async, user, password);

    if (async === false) //erroring here is actually permitted by spec
      throw new DOMException("InvalidAccessError") 
    
    this.#init_internal();
    this.readyState = this.OPENED;
    this.#req_url = new URL(url, ctx.location.href);
    this.#req_url.username = user || "";
    this.#req_url.password = password || "";
    this.#req_options.headers = {};
    this.#req_options.method = method.toUpperCase();
  }

  overrideMimeType(mime_type) {
    this.#mime_type = mime_type;
  }

  send(body) {
    console.log("DEBUG XHR.send", this, body);
    if (this.#req_options.method === "GET")
      body = undefined;

    if (this.timeout) {
      setTimeout(() => {
        if (this.readyState !== this.DONE)
          this.abort();
      }, this.timeout);
    }
    this.#req_options.body = body || undefined;

    (async () => {
      try {
        this.#response = await network.fetch(this.#req_url, this.#req_options);
        this.readyState = this.HEADERS_RECEIVED;
        this.readyState = this.LOADING;
  
        if (this.#aborted) return;
        this.#emit_event(new ProgressEvent("loadstart"));
        this.#response_data = await this.#response.arrayBuffer();
        this.#emit_event(new ProgressEvent("progress"));
        this.readyState = this.DONE;
        this.#emit_event(new ProgressEvent("load"));
      }
      catch (e) {
        this.#emit_event(new ProgressEvent("error"));
      }
      this.#emit_event(new ProgressEvent("loadend"));  
    })();
  }

  setRequestHeader(header, value) {
    if (!this.#req_options.headers) this.#req_options.headers = {};
    this.#req_options.headers[header] = value;
  }

  set readyState(value) {
    if (value !== this.#ready_state) {
      this.#ready_state = value;
      this.#emit_event(new Event("readystatechange"))  
    }
  }

  get readyState() {
    return this.#ready_state;
  }

  get response() {
    if (this.#response_data === null) 
      return undefined;
    if (this.responseType === "blob") 
      return new Blob([this.#response_data]);
    else if (this.responseType === "arraybuffer")
      return this.#response_data;
    else
      return this.responseText;
  }

  get responseText() {
    if (!this.#response_data) return "";
    return new TextDecoder().decode(this.#response_data);
  }

  get responseURL() {
    if (!this.#response) return "";
    return this.#response.url;
  }

  get responseXML() {
    if (this.responseType !== "document" && this.responseType !== "")
      throw new DOMException("InvalidStateError");
    if (this.#response === null)
      return null;
    if (this.#response_data === null) 
      throw new DOMException("InvalidStateError");
    return new DOMParser().parseFromString(this.responseText, this.#mime_type || "text/html");
  }

  get status() {
    if (!this.#response) return 0;
    return this.#response.status;
  }

  get statusText() {
    if (!this.#response) return "";
    return this.#response.statusText;
  }

  get upload() {
    return this.#upload;
  }
}