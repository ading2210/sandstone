export function rewrite_links(html) {
  let preload_links = html.querySelectorAll("link[rel='preload']");

  for (let i = 0; i < preload_links.length; i++) {
    let link_element = preload_links[i];
    link_element.remove();
  }
}