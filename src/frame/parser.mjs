import * as util from "../util.mjs";

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

    this.create_handler("FunctionDeclaration");
    this.create_handler("BlockStatement");
    this.create_handler("ClassDeclaration");
    this.create_handler("VariableDeclaration");
    this.create_handler("ForStatement");
    this.create_handler("ThisExpression");
    this.create_handler("FunctionExpression");
    this.create_handler("ArrowFunctionExpression");
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

  FunctionDeclaration_Enter() {
    this.function_depth++;
  }
  FunctionDeclaration_Exit(node) {
    this.function_depth--;
    if (this.block_depth === 0)
      this.rewrites.push({type: "var", pos: node.end, name: node.id.name});
  }
  FunctionExpression_Enter(node) {
    this.function_depth++;
  }
  FunctionExpression_Exit() {
    this.function_depth--;
  }
  ArrowFunctionExpression_Enter() {
    this.function_depth++;
  }
  ArrowFunctionExpression_Exit() {
    this.function_depth--;
  }

  BlockStatement_Enter() {
    this.block_depth++;
    if (this.for_init) 
      this.for_init = false;
  }
  BlockStatement_Exit() {
    this.block_depth--;
  }

  ForStatement_Enter() {
    this.for_init = true;
  }
  ForStatement_Exit() {
    this.for_init = false;
  }

  ClassDeclaration_Exit(node) {
    if (this.block_depth === 0)
      this.rewrites.push({type: "var", pos: node.end, name: node.id.name});
  }

  ExpressionStatement_Exit(node) {
    if (!node.expression.left) 
      return;
    if (!node.expression.left.type === "Identifier") 
      return;
    this.rewrites.push({type: "var", pos: node.end, name: node.expression.left.name});
  }

  VariableDeclaration_Exit(node) {
    if (this.for_init) 
      return;
    if (this.block_depth !== 0 && this.function_depth !== 0) 
      return;
    for (let decl of node.declarations) {
      if (this.block_depth !== 0 && node.kind !== "var") 
        continue;
      this.rewrites.push({type: "var", pos: node.end, name: decl.id.name});
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
}

function gen_rewrite_code(rewrite) {
  if (rewrite.type === "var") {
    let replacement = `; if (typeof ${rewrite.name} !== "undefined") {__ctx__.${rewrite.name} = ${rewrite.name}}; `;
    return [replacement, rewrite.pos];
  }
  if (rewrite.type === "this") {
    let replacement = `__ctx__.__get_this__(this)`;
    if (rewrite.parentheses)
      replacement = `(${replacement})`;
    return [replacement, rewrite.pos + 4];
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
