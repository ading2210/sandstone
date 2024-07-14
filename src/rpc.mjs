export let role = null;
export const rpc_handlers = {};
export const rpc_requests = {};

async function handle_procedure_call(msg) {
  if (!rpc_handlers[msg.procedure]) {
    return;
  }

  let output;
  try {
    output = {
      value: await rpc_handlers[msg.procedure](...msg.arguments),
      success: true
    };
  }
  catch (e) {
    output = {
      value: e,
      success: false
    };
  }

  return {
    type: "reply",
    id: msg.id,
    content: output
  };
}

function handle_procedure_reply(msg) {
  if (!rpc_requests[msg.id]) {
    return;
  }
  rpc_requests[msg.id](msg.content);
  delete rpc_requests[msg.id];
}

async function message_listener(event) {
  let msg = event.data;
  if (typeof msg.type === "undefined") return;
  console.log(`${role} got`, msg);

  if (msg.type === "procedure") {
    let output = await handle_procedure_call(msg);
    if (!event.source) return;
    if (output) {
      event.source.postMessage(output, "*");
    }
  }
  else if (msg.type === "reply") {
    handle_procedure_reply(msg);
  }
}

export async function call_procedure(target, procedure, args) {
  if (target instanceof HTMLIFrameElement) {
    target = target.contentWindow;
  }
  let msg = {
    type: "procedure",
    id: Math.random() + "",
    procedure: procedure,
    arguments: args
  }

  return await new Promise((resolve, reject) => {
    rpc_requests[msg.id] = (reply) => {
      if (reply.success) resolve(reply.value);
      else reject(reply.value);
    }
    console.log(`${role} sending`, msg);
    target.postMessage(msg, "*");  
  });
}

export function create_rpc_wrapper(target, procedure) {
  return function(){
    return call_procedure(target, procedure, [...arguments]);
  }
}

export function set_role(value) {
  role = value;
}

window.addEventListener("message", message_listener);