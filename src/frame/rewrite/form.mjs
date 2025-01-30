import { ctx, convert_url } from "../context.mjs";
import * as parser from "../parser.mjs";
import * as loader from "../loader.mjs";

const form_action_html = `
  <!DOCTYPE html>
  <style>
    html {
      background-color: rgb(34, 34, 34);
    }
  <\/style>
  <script>
    let original_url = "__ORIGINAL_URL__";
    let frame_id = "__FRAME_ID__";
    window.onload = () => {
      let url_params = new URLSearchParams(document.body.textContent);
      let new_url = original_url;
      let post_data = null;
      document.body.textContent = "";

      if (url_params.get("__form_method") === "post") {
        post_data = {
          method: url_params.get("__form_method"),
          enctype: url_params.get("__form_enctype")
        };
        url_params.delete("__form_method");
        url_params.delete("__form_enctype");
        post_data.body = url_params.toString();
      }
      else {
        new_url += String.fromCharCode(63) + url_params.toString();
      }
      
      top.postMessage({
        type: "procedure",
        id: Math.random() + "",
        procedure: "navigate",
        arguments: [frame_id, new_url, true, post_data]
      }, {targetOrigin: "*"});
    }
  <\/script>
`;

function create_hidden_input(name, value) {
  let hidden_input = document.createElement("input");
  hidden_input.type = "hidden";
  hidden_input.name = name;
  hidden_input.value = value;
  return hidden_input;
}

export function rewrite_form(form_element) {
  function convert_action(action) {
    let url = convert_url(action, ctx.location.href);
    let new_html = form_action_html
      .replace("__ORIGINAL_URL__", url)
      .replace("__FRAME_ID__", loader.frame_id);
    return `data:text/html,${new_html}`;
  }

  form_element.setAttribute = new Proxy(form_element.setAttribute, {
    apply(target, this_arg, args) {
      if (args[0] === "action" && !args[1].startsWith("data:")) {
        args[1] = convert_action(args[1]);
      }
      return target.apply(this_arg, args);
    },
  })

  let current_action = form_element.getAttribute("action");
  if (!current_action) return;
  form_element.setAttribute("action", current_action);

  if (form_element.method === "post") {
    form_element.method = "get";
    form_element.append(create_hidden_input("__form_method", "post"));
    form_element.append(create_hidden_input("__form_enctype", form_element.enctype));
  }
  form_element.setAttribute("method", "get");
}