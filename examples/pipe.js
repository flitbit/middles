const assert = require('assert-plus');
const { Pipeline } = require('../dist');

const final = async v => {
  console.log(`Final: ${v}`);
  return !v;
};

const toggle = v => {
  console.log(`Toggle: ${v}`);
  return !v;
};

(async () => {
  const pipe = new Pipeline(final).add(toggle);
  const res = await pipe.push(true);
  console.log(`Last: ${res}`);
})();
