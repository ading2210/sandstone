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