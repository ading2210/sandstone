import * as util from "../util.mjs";

import * as meriyah from "meriyah";

let total_time = 0;

function recurse_script_body(body, top_level=false) {
  let found_vars = [];
  if (!body) return found_vars;
  if (body.body)
    return recurse_script_body(body.body);

  for (let node of body) {
    if (node.type === "VariableDeclaration") {
      for (let decl of node.declarations) {
        if (!top_level && node.kind !== "var") continue;
        found_vars.push([decl.id.name, node.end]);
      }
    }
    else if (node.type === "ExpressionStatement") {
      if (!node.expression.left) continue;
      if (!node.expression.left.type === "Identifier") continue;
      found_vars.push([node.expression.left.name, node.end]);
    }
    else if (node.type === "FunctionDeclaration") {
      found_vars.push([node.id.name, node.end]);
    }
    else if (node.type === "ClassDeclaration") {
      found_vars.push([node.id.name, node.end]);
    }
    else if (node.type === "BlockStatement") {
      let vars = recurse_script_body(node.body);
      found_vars.push(...vars);
    }
    else if (node.type === "TryStatement") {
      found_vars.push(...recurse_script_body(node.block.body));
      found_vars.push(...recurse_script_body(node.handler.body.body));
    }
    
    if (node.consequent) {
      found_vars.push(...recurse_script_body(node.consequent.body));
    }
    if (node.alternate) {
      found_vars.push(...recurse_script_body(node.alternate.body));
    }
  }

  return found_vars;
}

export function rewrite_js(js) {
  let start = performance.now();
  let parsed_script = meriyah.parse(js, {ranges: true, webcompat: true});
  let found_vars = recurse_script_body(parsed_script.body, true);

  let rewritten_js = "";
  if (found_vars) {
    let prev_offset = 0;
    for (let [identifier, offset] of found_vars) {
      rewritten_js += js.substring(prev_offset, offset);
      rewritten_js += `; if (typeof ${identifier} !== "undefined") {globalThis.${identifier} = ${identifier}}; `;
      prev_offset = offset;
    }
    rewritten_js += js.substring(prev_offset);
  }

  let end = performance.now();
  total_time += end - start;
  let time_rounded = util.round_float(end - start, 2);
  let total_rounded = util.round_float(total_time, 2)
  console.log(`parse + rewrite took ${time_rounded} ms, total is ${total_rounded} ms`);
  
  return rewritten_js || js;
}
