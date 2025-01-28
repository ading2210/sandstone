export let role = null;
export const rpc_handlers = {};
export const rpc_requests = {};
export let host = null;
export let on_attach = () => {};

//a flexible wrapper for message ports
export class RPCTarget {
  constructor(target=null) {
    this.target = null;
    this.extra_targets = [];
    this.msg_callback = this.handle_msg.bind(this);
    this.onmessage = () => {};
    if (target)
      this.set_target(target);
  }

  set_target(new_target) {
    if (this.target)
      this.target.removeEventListener("message", this.msg_callback);
    for (let target of this.extra_targets) {
      target.removeEventListener("message", this.msg_callback);
    }
    this.target = new_target;
    this.extra_targets = [];
    this.target.addEventListener("message", this.msg_callback);
  }

  add_extra_target(target) {
    target.addEventListener("message", this.msg_callback);
    this.extra_targets.push(target);
  }

  handle_msg(event) {
    this.onmessage(event, this);
  }

  postMessage(...args) {
    this.target.postMessage(...args)
  }
}

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
    console.error(e);
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

export async function message_listener(event, target) {
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
      host.postMessage(msg, {targetOrigin: "*", transfer: [msg_port]});
    }
    else {
      target.add_extra_target(msg_port);
      msg_port.start();
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
    return call_procedure(target, procedure, [...arguments]);
  }
}

//attach an additional message port to the host
export function attach_host(msg_port) {
  let msg = {
    type: "attach",
    id: Math.random() + ""
  };
  host.postMessage(msg, {targetOrigin: "*", transfer: [msg_port]});
}

//tell a child frame to set a message port as the host rpc target
export function set_host(frame, msg_port) {
  let msg = {
    type: "set_host",
    id: Math.random() + ""
  };
  let msg_target = frame.contentWindow || frame;
  msg_target.postMessage(msg, {targetOrigin: "*", transfer: [msg_port]})
}

export async function wait_on_frame(frame) {
  let resolved = false;

  globalThis.addEventListener("message", (event) => {
    let msg = event.data;
    if (msg.type === "pong") 
      resolved = true;
  });
  
  while (!resolved) {
    let msg = {
      type: "ping",
      id: Math.random() + ""
    };
    frame.contentWindow.postMessage(msg, "*");
    await new Promise(r => setTimeout(r, 50));
  }
}

//handle the initial set_host message from the host
function host_set_handler(event) {
  let msg = event.data;
  let msg_port = event.ports[0];

  if (msg.type === "ping") {
    let msg = {
      type: "pong",
      id: Math.random() + ""
    };
    event.source.postMessage(msg, "*");
    return;
  }

  if (msg.type === "set_host" && msg_port) {
    if (!host.target) {
      host.set_target(msg_port);
      on_attach();
    }
    else {
      host.add_extra_target(msg_port);
    }
    msg_port.start();
  }
}

export function set_role(value) {
  role = value;
}
export function set_on_attach(callback) {
  on_attach = callback;
}

//create an rpc target for the host if we are in a child frame
if (self.parent !== globalThis || typeof globalThis.importScripts === "function") {
  host = new RPCTarget();
  host.onmessage = message_listener;
  self.addEventListener("message", host_set_handler);
}