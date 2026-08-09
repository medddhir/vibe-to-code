/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const {
  checkSystemLayer,
  createWorkspaceItem,
  inspectWorkbenchDocument,
  resolveLearningPath,
  runSavedPrintSource,
  runTerminalCommand,
} = require("../src/lib/computer-confidence-simulators.ts");

describe("Level 0 deterministic learning simulators", () => {
  it("runs only one bounded quoted print instruction", () => {
    assert.deepEqual(runSavedPrintSource('print("Hello, learner!")'), {
      ok: true,
      output: "Hello, learner!",
    });
    assert.equal(runSavedPrintSource("fetch('https://example.com')").ok, false);
    assert.equal(runSavedPrintSource("print(name)").ok, false);
    assert.equal(runSavedPrintSource('print("one")\nprint("two")').ok, false);
  });

  it("sorts system layers with clear deterministic feedback", () => {
    assert.equal(checkSystemLayer("keyboard", "hardware").ok, true);
    assert.equal(checkSystemLayer("chrome", "website").ok, false);
    assert.match(checkSystemLayer("chrome", "application").message, /installed application/i);
  });

  it("creates only safe, non-duplicate workspace names", () => {
    const created = createWorkspaceItem([], "/workspace", "folder", "my-first-site");
    assert.equal(created.ok, true);
    assert.equal(createWorkspaceItem(created.entries, "/workspace", "folder", "my-first-site").ok, false);
    assert.equal(createWorkspaceItem([], "/workspace", "file", "../secret.txt").ok, false);
    assert.equal(createWorkspaceItem([], "/workspace", "file", "index.html").ok, true);
  });

  it("resolves relative paths while containing traversal inside the project", () => {
    assert.deepEqual(resolveLearningPath("/project/pages", "../images/logo.svg"), {
      ok: true,
      resolvedPath: "/project/images/logo.svg",
      message: "Resolved to /project/images/logo.svg",
    });
    assert.equal(resolveLearningPath("/project", "../../outside.txt").ok, false);
    assert.equal(resolveLearningPath("/project", "/project-copy/secret.txt").ok, false);
    assert.equal(resolveLearningPath("/project", "images\\logo.svg").resolvedPath, "/project/images/logo.svg");
  });

  it("supports only the strict navigation command grammar", () => {
    const initial = {
      cwd: "/home/learner",
      directories: ["/home", "/home/learner", "/home/learner/projects"],
    };
    const made = runTerminalCommand(initial, "mkdir practice");
    assert.equal(made.ok, true);
    assert.equal(made.state.directories.includes("/home/learner/practice"), true);
    const moved = runTerminalCommand(made.state, "cd practice");
    assert.equal(moved.state.cwd, "/home/learner/practice");
    assert.equal(runTerminalCommand(initial, "rm -rf practice").ok, false);
    assert.equal(runTerminalCommand(initial, "ls; whoami").ok, false);
  });

  it("inspects a bounded saved heading without executing learner markup", () => {
    assert.equal(inspectWorkbenchDocument("<h1>Hello, coder!</h1>", "Hello, coder!").ok, true);
    assert.equal(inspectWorkbenchDocument("<h1>Wrong</h1>", "Hello, coder!").ok, false);
    assert.equal(inspectWorkbenchDocument("<script>alert(1)</script>", "Hello, coder!").ok, false);
  });
});
