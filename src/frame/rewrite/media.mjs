import { ctx, convert_url, intercept_property, proxy_function } from "../context.mjs";
import * as network from "../network.mjs";
import * as util from "../../util.mjs";

export function rewrite_media(media_element) {
  let media_src = media_element.src;
  
  //ensure there is only one source element in a video tag
  if (media_element instanceof HTMLVideoElement) {
    let source = media_element.querySelector("source[src]");
    while (media_element.lastChild !== source) 
      media_element.lastChild.remove();
  }

  let media_url = "";
  let fetch_src = async (value) => {
    media_element.setAttribute("__src", value);
    media_url = convert_url(value, ctx.location.href);
    let response = await network.fetch(media_url);
    let media_blob = await response.blob();
    let blob_url = URL.createObjectURL(media_blob);
    media_element.src = blob_url;

    //if this is a source element for a media element, we should load the video
    if (media_element instanceof HTMLSourceElement) {
      let parent = media_element.parentNode;
      while (parent && !(parent instanceof HTMLVideoElement))
        parent = parent.parentNode;
      if (!parent) 
        return;

      parent.load();
      if (!parent.autoplay) return
      parent.play();
    }
  };
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
  });

  media_element.addEventListener("error", (event) =>  {
    if (!src_descriptor || src_descriptor.get.call(media_element) === "") {
      event.stopImmediatePropagation();
    }
  }, true);

  proxy_function(media_element, "setAttribute", (target, this_arg, args) => {
    if (args[0] === "src")  {
      media_element.src = args[1];
      return;
    }
    return Reflect.apply(target, this_arg, args);
  })
  
  //to lazy to parse srcset, so i'll just ignore it
  if (media_element.getAttribute("srcset")) {
    media_element.setAttribute("srcset", "");
  }

  if (!media_src || media_src.startsWith("data:") || media_src.startsWith("blob:")) {
    return;
  }
  
  media_element.src = media_src;
}