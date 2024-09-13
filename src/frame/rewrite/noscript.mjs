export function rewrite_noscript(html) {
  let noscript_elements = html.querySelectorAll("noscript");

  for (let i = 0; i < noscript_elements.length; i++) {
    let noscript_element = noscript_elements[i];
    let comment = new Comment("noscript element:");
    comment.textContent  = "NOSCRIPT: " + noscript_element.innerHTML;
    noscript_element.parentNode.insertBefore(comment, noscript_element);
    noscript_element.remove();
  }
}