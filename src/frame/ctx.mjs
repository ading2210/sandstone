import * as polyfill from "./polyfill/index.mjs";

const internal = {
  location: null
};

class CustomCTX extends EventTarget {
  set location(value) {
    this.location.href = "" + value;
  }
  get location() {
    return internal.location;
  }
}

export function update_ctx() {
  internal.location = new polyfill.FakeLocation();
}

export function convert_url(url, base) {
  let url_obj = new URL(url, base);
  return url_obj.href;
}

export const ctx = new CustomCTX();