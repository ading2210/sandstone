import { ctx, convert_url } from "../ctx.mjs";
import * as network from "../network.mjs";

export function rewrite_media(html) {
  let media_elements = html.querySelectorAll("img[src], source[src], img[srcset], source[srcset], video[src], audio[src]");

  for (let i = 0; i < media_elements.length; i++) {
    let media_element = media_elements[i];
    let media_src = media_element.src;

    if (media_element instanceof HTMLSourceElement) {
      media_element.remove();
      continue;
    }

    if (!media_src) {
      continue;
    }

    media_element.setAttribute("__src", media_src);
    media_element.src = "";
    //to lazy to parse srcset, so i'll just ignore it
    if (media_element.getAttribute("srcset")) {
      media_element.setAttribute("srcset", "");
    }
    
    (async () => {
      let media_url = convert_url(media_src, ctx.location.href);
      let response = await network.fetch(media_url);
      let media_blob = await response.blob();
      let blob_url = URL.createObjectURL(media_blob);
      media_element.src = blob_url;
    })();
  }
}

