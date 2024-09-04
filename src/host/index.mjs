export * as controller from "./controller.mjs";
export * as network from "./network.mjs";

import * as rpc from "../rpc.mjs";
rpc.set_role("host");

export { libcurl } from "libcurl.js/bundled";