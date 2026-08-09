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

  it("keeps ordinary safe css rendering", () => {
    const preview = buildLanguagePreview({
      html: "<body><div class=\"card\">Safe</div></body>",
      css: "body { margin: 0; }\n.card { color: blue; padding: 16px; background-color: white; }",
      javascript: "console.log('ignore me')",
    });

    assert.match(preview, /<style>[\s\S]*body \{ margin: 0; \}[\s\S]*\.card \{ color: blue; padding: 16px; background-color: white; \}/);
  });

  it("builds previews without mixed-case or unclosed script tags", () => {
    const preview = buildLanguagePreview({
      html: "<body><p>Safe</p><ScRiPt>window.top.alert('x')</ScRipT><div>after</div></body>",
      css: "body { color: green; }",
      javascript: "console.log('never shown')",
    });

    assert.equal(preview.includes("<script"), false);
    assert.equal(preview.includes("window.top"), false);
    assert.equal(preview.includes("never shown"), false);
    assert.ok(/<body>[\s\S]*<p>Safe<\/p>[\s\S]*<div>after<\/div>[\s\S]*<\/body>/.test(preview));
  });

  it("builds previews without event handler attributes", () => {
    const preview = buildLanguagePreview({
      html:
        "<body><button onclick=\"alert('x')\" onmouseover=alert('y')>Run</button><p>ok</p></body>",
      css: "button { color: red; }",
      javascript: "console.log('nope')",
    });

    assert.equal(preview.includes("onclick"), false);
    assert.equal(preview.includes("onmouseover"), false);
    assert.equal(preview.includes("alert("), false);
  });

  it("removes image and frame based tags from learner HTML", () => {
    const preview = buildLanguagePreview({
      html: `<body><img src="https://evil.example/pixel.png" /><iframe src="https://evil.example/app"></iframe><p>Visible</p></body>`,
      css: "p { color: blue; }",
      javascript: "console.log('drop')",
    });

    assert.equal(preview.includes("<img"), false);
    assert.equal(preview.includes("<iframe"), false);
    assert.equal(preview.includes("https://evil.example"), false);
    assert.match(preview, /<body>[\s\S]*<p>Visible<\/p>[\s\S]*<\/body>/);
  });

  it("removes embedded form and refresh metadata constructs", () => {
    const preview = buildLanguagePreview({
      html:
        "<head><meta http-equiv=\"refresh\" content=\"0;url=https://evil.example\"></head><body><form action=\"https://evil.example/submit\"><input value=\"x\"><button formaction=\"https://evil.example/alt\">send</button></form><p>State</p></body>",
      css: "p { color: navy; }",
      javascript: "console.log('hidden')",
    });

    assert.equal(preview.includes("<form"), false);
    assert.equal(preview.includes("http-equiv"), false);
    assert.equal(preview.includes("action"), false);
    assert.match(preview, /<body>[\s\S]*<p>State<\/p>[\s\S]*<\/body>/);
  });

  it("strips CSS import and URL escapes from preview style", () => {
    const preview = buildLanguagePreview({
      html: "<body><p>Theme</p></body>",
      css: '@import "https://evil.example/theme.css"; body { background: url("https://evil.example/img.png"); }',
      javascript: "",
    });

    assert.equal(preview.includes("@import"), false);
    assert.equal(preview.includes("url("), false);
  });

  it("rejects escaped URL keywords in css", () => {
    const preview = buildLanguagePreview({
      html: "<body><p>Theme</p></body>",
      css: "body { background: u\\72l(\"https://evil.example/pixel.png\"); }",
      javascript: "",
    });

    assert.equal(preview.includes("<style"), true);
    assert.equal(preview.includes("u\\72l"), false);
    assert.equal(preview.includes("https://evil.example/pixel.png"), false);
    assert.equal(preview.includes("background"), false);
  });

  it("rejects image-set values and external URLs before render", () => {
    const preview = buildLanguagePreview({
      html: "<body><p>Image</p></body>",
      css: 'body { background-image: image-set("https://evil.example/pixel.png" 1x); }',
      javascript: "",
    });

    assert.equal(preview.includes("image-set"), false);
    assert.equal(preview.includes("https://"), false);
    assert.equal(preview.includes("pixel.png"), false);
  });

  it("rejects escaped @import and comment-obfuscated bypasses", () => {
    const preview = buildLanguagePreview({
      html: "<body><p>Theme</p></body>",
      css: "@iMpoRt \"https://evil.example/theme.css\";\nbody { color: blue; }\nbody { background: u/*x*/rl(\"https://evil.example/img.png\"); }",
      javascript: "",
    });

    assert.equal(preview.includes("@import"), false);
    assert.equal(preview.includes("url("), false);
    assert.equal(preview.includes("background"), false);
    assert.equal(preview.includes("https://"), false);
  });

  it("rejects protocol-relative and data/blob/file-like css", () => {
    const preview = buildLanguagePreview({
      html: "<body><p>Policy</p></body>",
      css: [
        "body { background: url(//evil.example/pixel.png); }",
        "body { background: data:text/css,color:red; }",
        "body { background: blob:http://evil.example/token; }",
        "body { background: file:///tmp/x; }",
      ].join("\n"),
      javascript: "",
    });

    assert.equal(preview.includes("url"), false);
    assert.equal(preview.includes("data:"), false);
    assert.equal(preview.includes("blob:"), false);
    assert.equal(preview.includes("file://"), false);
    assert.equal(preview.includes("//evil.example"), false);
  });

  it("blocks style tag breakout attempts and keeps content visible", () => {
    const preview = buildLanguagePreview({
      html: "<body><p>Outer</p></style><script>alert(1)</script><style>p{color:red}</style><p>After</p></body>",
      css: "",
      javascript: "console.log('no')",
    });

    assert.equal(preview.includes("<script"), false);
    assert.equal(preview.includes("alert(1)"), false);
    const [, bodySection] = preview.split("</head>");
    assert.equal(bodySection.includes("<style"), false);
    assert.equal(bodySection.includes("</style"), false);
    assert.match(preview, /<body>[\s\S]*<p>Outer<\/p>[\s\S]*<p>After<\/p>[\s\S]*<\/body>/);
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
