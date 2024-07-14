import * as loader from "../loader.mjs";

let internal = null;

export class FakeLocation {
  constructor() {
    internal = new URL(loader.url);
    
    for (let key in internal) {
      if (typeof key === "function") continue;

      Object.defineProperty(this, key, {
        get: () => {
          return internal[key];
        },
        set: (value) => {
          if (key !== "href") {
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
    loader.navigate(url);
  }
}