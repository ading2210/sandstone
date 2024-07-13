let from_id = (id) => document.getElementById(id);

function navigate_clicked() {
  let url = from_id("url_box").value;
}

window.onload = () => {
  from_id("navigate_button").onload = navigate_clicked;
}