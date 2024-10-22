import * as loader from "../loader.mjs";

export class FakeStorage {
  #map;
  #mode;
  #pending_sync;

  constructor(mode) {
    this.#map = new Map();
    this.#mode = mode;
    this.#pending_sync = false;

    return new Proxy(this, {
      get: (target, key, receiver) => {
        if (typeof this[key] === "function")
          return this[key].bind(this);
        if (this.#map.has(key)) 
          return this.#map.get(key);
        return this[key];
      },
      set: (target, key, value) => {
        this.setItem(key, value);
      }
    })
  }

  #sync() {
    if (this.#pending_sync) return;
    this.#pending_sync = true;
    setTimeout(() => {
      let storage_entries = [...this.#map];
      if (this.#mode === "local")
        loader.local_storage(loader.frame_id, storage_entries);
      this.#pending_sync = false;
    }, 100);
  }

  clear() {
    this.#map.clear();
    this.#sync();
  }

  getItem(key) {
    return this.#map.get(key+"") || null;
  }

  setItem(key, value) {
    this.#map.set(key+"", value+"");
    this.#sync();
  }
  
  removeItem(key) {
    this.#map.delete(key+"");
    this.#sync();
  }

  _get_entries() {
    return [...this.#map];
  }

  toString() {
    return "[object Storage]";
  }
}