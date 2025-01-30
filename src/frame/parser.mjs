import * as util from "../util.mjs";
import { ctx_vars, unreadable_vars } from "./context.mjs";

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

    this.ThisExpression = this.ThisExpression.bind(this);
    this.Identifier = this.Identifier.bind(this);
    this.BlockStatement = this.BlockStatement.bind(this);
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
    this.rewrites.push({type: "this", pos: node.start, parentheses: parentheses});
  }

  Identifier(node) {
    let parent = node.path.parent;
    if (parent.type === "MemberExpression" && parent.start !== node.start) 
      return;
    if (parent.type === "VariableDeclarator" && parent.id === node)
      return;
    let ignored_parents = [
      "Property", "FunctionDeclaration", "AssignmentPattern", 
      "FunctionExpression", "ArrowFunctionExpression", "MethodDefinition"
    ];
    if (ignored_parents.includes(parent.type))
      return;
    if (!ctx_vars.includes(node.name)) 
      return;

    //this behavior isn't really correct
    let simple = false;
    if (parent.type === "AssignmentExpression" && parent.left === node) {
      if (node.name !== "location")
        return;
      simple = true;
    }
    this.rewrites.push({type: "global", pos: node.start, name: node.name, simple: simple});
  }

  BlockStatement(node) {
    let first_node = node.body[0];
    if (!first_node) 
      return;

    if (first_node.type === "ExpressionStatement" && first_node.directive === "use asm") {
      return astray.SKIP;
    }
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
    let replacement;
    if (rewrite.simple || unreadable_vars.includes(rewrite.name)) 
      replacement = `__ctx__.${rewrite.name}`;
    else 
      replacement  = `(__get_var__(${rewrite.name}, "${rewrite.name}"))`;
    return [replacement, rewrite.pos + rewrite.name.length];
  }
  else if (rewrite.type === "delete") {
    let length = rewrite.end - rewrite.pos;
    return ["", rewrite.pos + length];
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
