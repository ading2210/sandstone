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