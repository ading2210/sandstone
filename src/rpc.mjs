export let role = null;
export const rpc_handlers = {};
export const rpc_requests = {};

export let parent = self.parent ? self.parent : self;

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

export async function message_listener(event) {
  let msg = event.data;
  let source = event.source || event.currentTarget;
  if (typeof msg.type === "undefined") return;
  console.log(`RPC ${role} got`, msg);

  if (msg.type === "procedure") {
    let output = await handle_procedure_call(msg);
    if (!source) return;
    if (output) {
      source.postMessage(output, {targetOrigin: "*"});
    }
  }
  else if (msg.type === "reply") {
    handle_procedure_reply(msg);
  }
  else if (msg.type === "attach") {
    let msg_port = event.ports[0];
    if (role === "frame") {
      parent.postMessage(msg, {targetOrigin: "*", transfer: [msg_port]});
    }
    else {
      msg_port.onmessage = message_listener;
    }
  }
}

export async function call_procedure(target, procedure, args) {
  if (globalThis.HTMLIFrameElement && target instanceof globalThis.HTMLIFrameElement) {
    target = target.contentWindow || target;
  }
  let msg = {
    type: "procedure",
    id: Math.random() + "",
    procedure: procedure,
    arguments: args
  };

  return await new Promise((resolve, reject) => {
    rpc_requests[msg.id] = (reply) => {
      if (reply.success) resolve(reply.value);
      else reject(reply.value);
    }
    console.log(`RPC ${role} sending`, msg);
    target.postMessage(msg, {targetOrigin: "*"});  
  });
}

export function create_rpc_wrapper(target, procedure) {
  return function() {
    let real_target = target === "parent" ? parent : target;
    return call_procedure(real_target, procedure, [...arguments]);
  }
}

export function set_role(value) {
  role = value;
}

export function set_parent(msg_channel) {
  let msg = {
    type: "attach",
    id: Math.random() + ""
  };
  parent.postMessage(msg, {targetOrigin: "*", transfer: [msg_channel.port1]});

  parent.removeEventListener("message", message_listener);
  parent = msg_channel.port2;
  parent.addEventListener("message", message_listener);
  parent.start();
}

self.addEventListener("message", message_listener);