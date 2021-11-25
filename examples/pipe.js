const assert = require('assert');
const { Pipeline } = require('../');

const final = (v) => {
  console.log(`Final: ${v}`);
  return !v;
};

const toggle = (v) => {
  console.log(`Toggle: ${v}`);
  return !v;
};

// Pipeline operations are synchronous unless you call one of the async alternatives...
const pipe = new Pipeline().add(toggle);
const res = pipe.push(true, final);
console.log(`Last: ${res}`);
assert(res === true, 'value should be true');

// Prints
// =============
// Toggle: true
// Final: true
// Last: true
