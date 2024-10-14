import { known_urls } from "../network.mjs";

export class FakeURL extends URL {
  constructor(url, base) {
    url = url instanceof URL ? url.href : url;
    base = base instanceof URL ? base.href : base;
    url = known_urls[url] || url;
    base = known_urls[base] || base;
    super(url, base);
  }
}