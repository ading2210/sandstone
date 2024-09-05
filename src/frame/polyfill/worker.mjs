import * as network from "../network.mjs";
import { runtime_src } from "../loader.mjs";
import { wrap_obj } from "../context.mjs";

export class FakeWorker extends EventTarget {
  #url; #options; #worker; #msg_queue; #terminated;

  constructor(url, options) {
    console.log("DEBUG new Worker", url, options);
    super();
    this.#url = url;
    this.#options = options;
    this.#worker = null;
    this.#msg_queue = [];
    this.#terminated = false;

    this.onerror = () => {};
    this.onmessage = () => {};
    this.onmessageerror = () => {};

    this.#load_worker();
  }

  async #load_worker() {
    let response = await network.fetch(this.#url);
    let worker_js = await response.text();
    let blob = new Blob([worker_js], {type: "text/javascript"});
    let blob_url = network.create_blob_url(blob, this.#url);

    if (this.#terminated)
      return;

    this.#worker = new Worker(blob_url, this.#options);
    for (let event of ["error", "message", "messageerror"]) {
      this.#setup_listener(event);
    }
  }

  #setup_listener(event_name) {
    this.#worker.addEventListener(event_name, (event) => {
      this["on" + event_name](event);
      let new_event = new event.constructor(event_name);
      wrap_obj(event, new_event);
      this.dispatchEvent(new_event);
    })
  }

  postMessage(message, transfer) {
    if (this.#worker == null) 
      this.#msg_queue.push([message, transfer]);
    else
      this.#worker.postMessage(message, transfer)
  }

  terminate() {
    this.#worker.terminate();
    this.#terminated = true;
  }
}