import { ctx, convert_url } from "../context.mjs";
import * as network from "../network.mjs";

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
  let src_descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(media_element), "src");
  Object.defineProperty(media_element, "src", {
    get() {
      if (!src_descriptor) return;
      return src_descriptor.get.call(media_element);
    },
    set(value) {
      if (!src_descriptor) return;
      if (value.startsWith("blob:") || !value)
        src_descriptor.set.call(media_element, value);
      else {
        media_element.src = "";
        fetch_src(value);
      }
    }
  })
  
  let fetch_src = async (value) => {
    media_element.setAttribute("__src", value);
    let media_url = convert_url(value, ctx.location.href);
    let response = await network.fetch(media_url);
    let media_blob = await response.blob();
    let blob_url = URL.createObjectURL(media_blob);
    media_element.src = blob_url;
  };
  media_element.src = "";
  fetch_src(media_src);
}

export function rewrite_all_media(html) {
  let media_elements = html.querySelectorAll("img[src], source[src], img[srcset], source[srcset], video[src], audio[src]");
  for (let i = 0; i < media_elements.length; i++)
    rewrite_media(media_elements[i]);
}

