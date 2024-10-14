export function rewrite_noscript(noscript_element) {
  let comment = new Comment(noscript_element.innerHTML);
  noscript_element.innerHTML = "";
  noscript_element.append(comment);
}
