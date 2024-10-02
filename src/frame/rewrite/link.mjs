export function rewrite_link(link_element) {
  link_element.remove();
}

export function rewrite_all_links(html) {
  let preload_links = html.querySelectorAll("link[rel='preload']");
  for (let i = 0; i < preload_links.length; i++) 
    rewrite_link(preload_links[i]);
}