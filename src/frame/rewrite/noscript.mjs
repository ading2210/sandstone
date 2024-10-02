export function rewrite_noscript(noscript_element) {
  let comment = new Comment();
  comment.textContent  = "NOSCRIPT: " + noscript_element.innerHTML;
  noscript_element.parentNode.insertBefore(comment, noscript_element);
  noscript_element.remove();
}

export function rewrite_all_noscript(html) {
  let noscript_elements = html.querySelectorAll("noscript");

  for (let i = 0; i < noscript_elements.length; i++)
    rewrite_noscript(noscript_elements[i])
}