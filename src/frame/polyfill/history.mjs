import * as loader from "../loader.mjs";
import { ctx, convert_url } from "../context.mjs";
import { internal } from "./location.mjs";

export class FakeHistory {
  #state;
  #url;
  scrollRestoration = "auto";

  get length() {return 1}
  get state() {return this.#state}

  back() {}
  forward() {}
  go() {}
  
  pushState(state, unused, url) {
    if (!url) return;
    this.#state = state;
    this.#url = url;
    let full_url = convert_url(url, ctx.location.href);
    internal.href = full_url;
    loader.navigate(loader.frame_id, full_url, false);
  }

  replaceState(state, unused, url) {
    this.pushState(state, unused, url);
  }
}