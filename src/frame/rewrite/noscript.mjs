export function rewrite_noscript(noscript_element) {
  let comment = new Comment();
  comment.textContent  = "NOSCRIPT: " + noscript_element.innerHTML;
  noscript_element.parentNode.insertBefore(comment, noscript_element);
  noscript_element.remove();
}
