export function rewrite_link(link_element) {
  if (["icon", "shortcut icon"].includes(link_element.rel)) return;
  link_element.rel = "__" + link_element.rel;
}