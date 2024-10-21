import * as loader from "../loader.mjs";

export let internal = null;

export class FakeLocation {
  constructor() {
    internal = new URL(loader.url);
    
    for (let key in internal) {
      if (typeof key === "function") continue;
      if (key === "toString") continue;

      Object.defineProperty(this, key, {
        get: () => {
          return internal[key];
        },
        set: (value) => {
          if (key === "href") {
            this.assign(value);
            return;
          }
          internal[key] = value;
          this.assign(internal.href);
        }
      })
    }
  }

  assign(url) {
    internal = new URL(url, internal);
    loader.navigate(loader.frame_id, internal.href);
  }
  replace(url) {
    this.assign(url);
  }
  reload() {
    this.assign(this.href);
  }
  toString() {
    return this.href;
  }
}