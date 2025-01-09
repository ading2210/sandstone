import * as util from "../util.mjs";
import { ctx, ctx_vars } from "./context.mjs";

import * as meriyah from "meriyah";
import * as astray from 'astray';

let total_time = 0;

class ASTVisitor {
  constructor(ast) {
    this.ast = ast;
    this.rewrites = [];
    this.block_depth = 0;
    this.function_depth = 0;
    this.for_init = false;

    this.create_handler("ThisExpression");
    this.create_handler("Identifier");
  }

  create_handler(type) {
    if (typeof this[type] === "function") {
      this[type] = this[type].bind(this)
    }
    else {
      this[type] = {
        enter: this[type + "_Enter"]?.bind(this),
        exit: this[type + "_Exit"]?.bind(this)
      }
    }
  }

  ThisExpression(node) {
    let parentheses = false;
    let parent_node = node;
    while (parent_node) {
      if (parent_node.type === "NewExpression") {
        parentheses = true;
        break;
      }
      parent_node = parent_node.path.parent;
    }
    this.rewrites.push({type: "this", pos: node.start, end: node.end, parentheses: parentheses});
  }

  Identifier(node) {
    let parent = node.path.parent;
    if (parent.type === "MemberExpression" && parent.start !== node.start) 
      return;
    let ignored_parents = [
      "Property", "FunctionDeclaration", "AssignmentPattern", 
      "FunctionExpression", "ArrowFunctionExpression", "MethodDefinition",
      "VariableDeclarator"
    ];
    if (ignored_parents.includes(parent.type))
      return;
    if (!ctx_vars.includes(node.name)) 
      return;
    
    this.rewrites.push({type: "global", pos: node.start});
  }
}

function gen_rewrite_code(rewrite) {
  if (rewrite.type === "this") {
    let replacement = `__get_this__(this)`;
    if (rewrite.parentheses)
      replacement = `(${replacement})`;
    return [replacement, rewrite.pos + 4];
  }
  else if (rewrite.type === "global") {
    let replacement  = `__ctx__.`;
    return [replacement, rewrite.pos];
  }
  throw new Error("invalid rewrite type");
}

export function rewrite_js(js) {
  let start = performance.now();
  let ast
  try {
    ast = meriyah.parse(js, {ranges: true, webcompat: true});
  }
  catch (e) {
    console.error("parse error", e);
    return js;
  }
  let patch_start = performance.now();
  let ast_visitor = new ASTVisitor(ast);
  astray.walk(ast, ast_visitor);
  ast_visitor.rewrites.sort((a, b) => a.pos - b.pos);

  let rewritten_js = "";
  if (ast_visitor.rewrites) {
    let prev_offset = 0;
    for (let rewrite of ast_visitor.rewrites) {
      rewritten_js += js.substring(prev_offset, rewrite.pos);
      let [replacement, offset] = gen_rewrite_code(rewrite);
      rewritten_js += replacement;
      prev_offset = offset;
    }
    rewritten_js += js.substring(prev_offset);
  }

  let end = performance.now();
  total_time += end - start;
  let parse_time_rounded = util.round_float(patch_start - start, 2);
  let patch_time_rounded = util.round_float(end - patch_start, 2);
  let total_rounded = util.round_float(total_time, 2)
  console.log(`parse took ${parse_time_rounded} ms, rewrite took ${patch_time_rounded} ms, total is ${total_rounded} ms (js size: ${Math.round(js.length/1024)} kb)`);
  
  return rewritten_js || js;
}
