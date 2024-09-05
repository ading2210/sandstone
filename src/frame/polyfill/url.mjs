import { known_urls } from "../network.mjs";

export class FakeURL extends URL {
  constructor(url, base) {
    console.log("DEBUG new URL", url, base);
    url = known_urls[url] || url;
    base = known_urls[base] || base;
    super(url, base);
  }
}