export function is_valid_url(url) {
  try {
    new URL(url);
    return true;
  }
  catch {
    return false;
  }
}

//similar to promise.all, but it returns undefined if there is an error
export async function run_parallel(promises) {
  let results = Array(promises.length);
  for (let [i, promise] of promises.entries()) {
    try {
      results[i] = await promise;
    }
    catch (e) {
      console.error(e);
    }
  }
  return results;
}

export function format_error(error) {
  let error_msg = error.stack;
  if (!error.stack)
    error_msg = new Error(error).stack;
  if (!error_msg.includes(error))
    error_msg = error + "\n\n" + error_msg;
  return error_msg;
}

//convert various data types to a uint8array (blobs excluded)
//taken from libcurl.js source
export function data_to_array(data) {
  //data already in correct type
  if (data instanceof Uint8Array) {
    return data;  
  }

  else if (typeof data === "string") {
    return new TextEncoder().encode(data);
  }

  else if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }

  //dataview objects or any other typedarray
  else if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer);
  }

  throw new TypeError("invalid data type to be sent");
}

export function url_is_http(url) {
  let url_obj = new URL(url, "http://example.com/");
  return url_obj.protocol === "http:" || url_obj.protocol === "https:";
}

export function round_float(num, digits) {
  let multiplier = Math.pow(10, digits);
  return Math.round(num * multiplier) / multiplier;
}
