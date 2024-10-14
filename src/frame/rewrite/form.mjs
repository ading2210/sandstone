import { ctx, convert_url } from "../context.mjs";
import * as loader from "../loader.mjs";

const form_action_html = `
  <style>
    html {
      background-color: rgb(34, 34, 34);
    }
  <\/style>
  <script>
    let original_url = "__ORIGINAL_URL__";
    let frame_id = "__FRAME_ID__";
    window.onload = () => {
      let url_params = document.body.textContent;
      let new_url = original_url + url_params;
      document.body.textContent = "";
      top.postMessage({
        type: "procedure",
        id: Math.random() + "",
        procedure: "navigate",
        arguments: [frame_id, new_url]
      }, {targetOrigin: "*"});
    }
  <\/script>
`;

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
}