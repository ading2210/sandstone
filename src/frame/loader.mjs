import * as rpc from "../rpc.mjs";

function load_html({html, url}) {

}

rpc.rpc_handlers["html"] = async (options) => {
  load_html(options);
}