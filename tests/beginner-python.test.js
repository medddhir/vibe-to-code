/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  runBeginnerPython,
  runBeginnerPythonWithTrace,
} = require("../src/lib/beginner-python.ts");

test("runs a simple numeric assignment and print", () => {
  const result = runBeginnerPython("score = 3\nscore = score + 2\nprint(score)");

  assert.equal(result.ok, true);
  assert.equal(result.output, "5");
});

test("prevents joining text and number with +", () => {
  const result = runBeginnerPython('label = "3"\nnumber = 3\nprint(label + number)');

  assert.equal(result.ok, false);
  assert.match(result.error, /only join values of the same type/);
});

test("keeps execution trace with each safe line", () => {
  const result = runBeginnerPythonWithTrace(
    'name = "A"\ncount = 2\nprint(name, count)',
    { includeTrace: true },
  );

  assert.equal(result.ok, true);
  assert.equal(result.trace?.length, 3);
  assert.equal(result.trace?.[2].action, "print");
});

test("exposes friendly message for empty scripts", () => {
  const result = runBeginnerPython("");
  assert.equal(result.ok, false);
  assert.equal(typeof result.friendlyMessage, "string");
});
