import { ctx, convert_url, intercept_property } from "../context.mjs";
import * as network from "../network.mjs";
import * as util from "../../util.mjs";

export function rewrite_media(media_element) {
  let media_src = media_element.src;

  if (media_element instanceof HTMLSourceElement) {
    media_element.remove();
    return;
  }

  if (!media_src || media_src.startsWith("data:") || media_src.startsWith("blob:")) {
    return;
  }
  
  //to lazy to parse srcset, so i'll just ignore it
  if (media_element.getAttribute("srcset")) {
    media_element.setAttribute("srcset", "");
  }

  let media_url = "";
  let src_descriptor = intercept_property(media_element, "src", {
    get() {
      return media_url || src_descriptor.get.call(media_element);
    },
    set(value) {
      if (!util.url_is_http(value) || !value)
        src_descriptor.set.call(media_element, value);
      else {
        media_element.src = "";
        fetch_src(value);
      }
    }
  })
    
  let fetch_src = async (value) => {
    media_element.setAttribute("__src", value);
    media_url = convert_url(value, ctx.location.href);
    let response = await network.fetch(media_url);
    let media_blob = await response.blob();
    let blob_url = URL.createObjectURL(media_blob);
    media_element.src = blob_url;
  };
  media_element.src = media_src;
}