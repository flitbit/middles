const assert = require('assert');
const { Pipeline } = require('../');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const toggleAsync = async (v) => {
  await delay(200);
  console.log(`Async Toggle: ${v}`);
  return !v;
};

const finalAsync = async (v) => {
  await delay(100);
  console.log(`Async Final: ${v}`);
  return !v;
};

const toggle = (v) => {
  console.log(`Toggle: ${v}`);
  return !v;
};

(async () => {
  // Pipeline operations are asynchronous when at-least-one async method has been called...
  const pipe = new Pipeline().add(toggle).addAsync(toggleAsync);
  const res = await pipe.pushAsync(true, finalAsync);
  console.log(`Last: ${res}`);
  assert(res === false, 'value should be false');

  // Prints
  // ===================
  // Toggle: true
  // Async Toggle:false
  // Async Final: true
  // Last: false
})();
