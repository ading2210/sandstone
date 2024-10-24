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
  }

  create_handler(type) {
    this[type] = {
      enter: this[type + "_Enter"]?.bind(this),
      exit: this[type + "_Exit"]?.bind(this)
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
}

export function rewrite_js(js) {
  let start = performance.now();
  let ast = meriyah.parse(js, {ranges: true, webcompat: true});
  let ast_visitor = new ASTVisitor(ast);
  astray.walk(ast, ast_visitor);

  let rewritten_js = "";
  if (ast_visitor.rewrites) {
    let prev_offset = 0;
    for (let rewrite of ast_visitor.rewrites) {
      rewritten_js += js.substring(prev_offset, rewrite.pos);
      if (rewrite.type === "var") {
        rewritten_js += `; if (typeof ${rewrite.name} !== "undefined") {__ctx__.${rewrite.name} = ${rewrite.name}}; `;
      }
      prev_offset = rewrite.pos;
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
