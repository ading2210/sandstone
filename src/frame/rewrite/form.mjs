import { ctx, convert_url } from "../context.mjs";
import { form } from "./index.mjs";

export function rewrite_form(form_element) {
  console.log("DEBUG rewrite_form", form_element);

  let url = convert_url(form_element.action, ctx.location.href);
  form_element.setAttribute("action", "about:blank");
  form_element.onsubmit = () => {return false};
  form_element.novalidate = false;

  form_element.addEventListener("submit", (event) => {
    event.preventDefault();
    let submit_button = form.querySelector("button, input[type='submit'], input[type='image']");
    let form_data = new FormData(form, submit_button);
    if (form_element.method === "get") {
      url += "?" + new URLSearchParams(form_data).toString();
    }
    //unfinished!
    return false;
  }); 
}

export function rewrite_all_forms(html) {
  let form_elements = html.querySelectorAll("form");
  for (let i = 0; i < form_elements.length; i++) {
    rewrite_form(form_elements[i]);
  }
}