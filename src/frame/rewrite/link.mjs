export function rewrite_link(link_element) {
  if (link_element.rel === "icon") return;
  link_element.rel = "__" + link_element.rel;
}