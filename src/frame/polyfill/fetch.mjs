import { ctx } from "../context.mjs";
import * as network from "../network.mjs";

export async function fetch(resource, params={}) {
  console.log("DEBUG fetch", resource, params);
  //parse resources and convert to a friendly form
  let url = resource;
  if (resource instanceof Request) {
    url = resource.url;
    params.body = params.body || await resource.blob();
    params.headers = params.headers || Object.fromEntries(resource.headers);
    params.method = params.method || resource.method;

    if (params.body.size === 0) {
      delete params.body;
    }
  }
  url = (new URL(url, ctx.location.href)).href;
  if (params.body instanceof ReadableStream) {
    params.duplex = "half";
  }
  if (params.signal) //abortsignal cant be cloned
    delete params.signal;

  //figure out the request body
  let request_obj = new Request("http://127.0.0.1/", params);
  let array_buffer = await request_obj.arrayBuffer();
  params.body = array_buffer.byteLength ? array_buffer : undefined;

  //perform the request
  return await network.fetch(url, params);
}