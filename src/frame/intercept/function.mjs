Function.prototype.__toString = Function.prototype.toString;
Function.prototype.toString = function() {
  let js = this.__toString();
  js = js.replaceAll("__ctx__.", "");
  js = js.replaceAll("__get_this__(this)", "this");
  return js;
}