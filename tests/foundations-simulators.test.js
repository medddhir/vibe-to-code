/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const {
  runDecisionScript,
  runStateUpdate,
  simulatePackageCommand,
  compareEnvironmentDependencies,
  simulateCodeJourney,
  validateLanguageFile,
  runFrontendJourney,
  buildLanguagePreview,
} = require("../src/lib/foundations-simulators.ts");

describe("Foundations simulators", () => {
  it("executes a simple decision script with loop and comparison", () => {
    const code = [
      "score = 3",
      "score = score + 1",
      "while score <= 3:",
      "score = score + 1",
      "if score >= 5:",
      "outcome = 'Pass'",
      "else:",
      "outcome = 'Retry'",
    ].join("\n");

  const result = runDecisionScript(code);

    assert.equal(result.ok, true);
    assert.equal(result.decision, "Retry");
    assert.ok(Array.isArray(result.trace));
    assert.ok(result.finalScore >= 4);
  });

  it("reports three loop body runs and four guard checks for score < 3", () => {
    const code = [
      "score = 0",
      "while score < 3:",
      "score = score + 1",
      "if score > 2:",
      "outcome = 'Pass'",
      "else:",
      "outcome = 'Retry'",
    ].join("\n");

    const result = runDecisionScript(code);

    assert.equal(result.ok, true);
    assert.equal(result.finalScore, 3);
    const loopBodySteps = result.trace.filter((step) => step.phase === "loop body").length;
    const loopCheckSteps = result.trace.filter(
      (step) => step.phase === "loop check" || step.phase === "loop condition",
    ).length;
    assert.equal(loopBodySteps, 3);
    assert.equal(loopCheckSteps, 4);
  });

  it("rejects assignment in condition (common beginner error)", () => {
    const code = ["score = 3", "if score = 5:", "outcome = 'Pass'", "else:", "outcome = 'Retry'"].join(
      "\n",
    );
    const result = runDecisionScript(code);

    assert.equal(result.ok, false);
    assert.match(result.error, /use `==`/i);
  });

  it("detects endless-loop protection", () => {
    const code = [
      "score = 0",
      "while score <= 3:",
      "score = score + 0",
      "if score > 10:",
      "outcome = 'Pass'",
      "else:",
      "outcome = 'Retry'",
    ].join("\n");

  const result = runDecisionScript(code);

  assert.equal(result.ok, false);
  assert.match(result.error, /loop body must increment by one|never stops/);
  });

  it("updates state safely", () => {
    const result = runStateUpdate(10, "4", "state = state + input");

    assert.equal(result.ok, true);
    assert.equal(result.state, 14);
    assert.equal(result.output, "state = 14");
    assert.ok(result.trace.length >= 1);
  });

  it("rejects zero division updates", () => {
    const result = runStateUpdate(10, "0", "state = state / input");

    assert.equal(result.ok, false);
    assert.equal(result.status, undefined);
    assert.match(result.error, /Division by zero/);
  });

  it("uses strict package install grammar", () => {
    const manifest = { react: "^17.0.0" };
    const result = simulatePackageCommand(manifest, "npm install typoPkg");

    assert.equal(result.ok, false);
    assert.equal(result.message, "Unknown package name.");
  });

  it("adds known package versions from the local catalog", () => {
    const manifest = {};
  const result = simulatePackageCommand(manifest, "npm install react");

  assert.equal(result.ok, true);
  assert.equal(result.manifest.react, "^18.2.0");
});

  it("detects environment mismatches", () => {
    const local = { react: "18.2.0", lodash: "4.17.21" };
    const prod = { react: "18.2.0", lodash: "4.17.20" };
    const compare = compareEnvironmentDependencies(local, prod);

    assert.equal(compare.matches, false);
    assert.equal(compare.mismatches.length, 1);
    assert.equal(compare.mismatches[0].packageName, "lodash");
  });

  it("builds a preview with only HTML and CSS and no injected script", () => {
    const preview = buildLanguagePreview({
      html: `<!doctype html><html><body><p>Hi</p><script>window.top.alert("x")</script></body></html>`,
      css: "body { color: blue; }",
      javascript: "console.log('no scripts allowed')",
    });

    assert.equal(preview.includes("<script>"), false);
    assert.equal(preview.includes("console.log('no scripts allowed')"), false);
    assert.match(preview, /<style>body \{ color: blue; \}<\/style>/);
    assert.match(preview, /<body>[\s\S]*<p>Hi<\/p>/);
  });

  it("builds different simulator routes by language", () => {
    const python = simulateCodeJourney("python");
    const compiled = simulateCodeJourney("compiled");

    assert.equal(python.language, "python");
    assert.equal(compiled.routeTagline.includes("language"), true);
    assert.ok(Array.isArray(python.steps) && python.steps.length >= 1);
  });

  it("checks language syntax hints", () => {
    const css = validateLanguageFile("css", "body { color: blue;");
    assert.equal(css.some((issue) => issue.message.includes("unbalanced")), true);
  });

  it("simulates frontend journey failures for invalid payloads", () => {
    const result = runFrontendJourney('{ userId: "a" }');
    assert.equal(result.ok, false);
    assert.equal(result.status, 400);
    assert.equal(result.requestLabel, "POST /simulate");
  });
});
