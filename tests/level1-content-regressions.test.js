/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const lessonPath = (relativePath) => path.join(process.cwd(), relativePath);

const lesson4Source = fs.readFileSync(
  lessonPath("src/app/lessons/languages-syntax-errors/page.tsx"),
  "utf8",
);
const lesson6Source = fs.readFileSync(
  lessonPath("src/app/lessons/packages-dependencies-environments/page.tsx"),
  "utf8",
);
const lesson2Source = fs.readFileSync(
  lessonPath("src/app/lessons/decisions-loops-functions/page.tsx"),
  "utf8",
);
const choiceCheckpointSource = fs.readFileSync(
  lessonPath("src/components/choice-checkpoint.tsx"),
  "utf8",
);
const languageLabSource = fs.readFileSync(
  lessonPath("src/components/foundations/language-syntax-lab.tsx"),
  "utf8",
);

describe("Level 1 content and interaction regressions", () => {
  it("Lesson 4 sorting checkpoint marks CSS as correct and keeps question readable", () => {
    assert.ok(lesson4Source.includes("question=\"Where should this line most likely live: body { margin: 0; }\""));
    assert.ok(!lesson4Source.includes("Where should this line most likely live? <code>"));
    assert.ok(lesson4Source.includes('correctId="css"'));
    assert.ok(lesson4Source.includes("Correct. `body { margin: 0; }` is a style rule, so it belongs in CSS."));
  });

  it("Lesson 6 lockfile checkpoint uses a reproducibility-focused correct answer", () => {
    assert.ok(lesson6Source.includes('id: "locks"'));
    assert.ok(lesson6Source.includes("exact resolved versions"));
    assert.ok(lesson6Source.includes("repeatable"));
    assert.ok(lesson6Source.includes("full resolved tree stable"));
  });

  it("Lesson 2 checkpoint uses accurate loop terminology for body runs and guard checks", () => {
    assert.ok(
      lesson2Source.includes(
        "For `while score < 3` starting at 0, how many body iterations happen, and how many guard checks occur?",
      ),
    );
    assert.ok(lesson2Source.includes('correctId="trace-three-with-checks"'));
    assert.ok(lesson2Source.includes("condition checked 4 times"));
  });

  it("ChoiceCheckpoint records hint usage only on the third failed attempt", () => {
    assert.ok(choiceCheckpointSource.includes("recordHintUsage(stepId);"));
    assert.ok(/if \(attempts === 2\)/.test(choiceCheckpointSource));
  });

  it("LanguageSyntaxLab preview uses sandbox-only iframe settings and no learner script injection path", () => {
    assert.ok(!languageLabSource.includes('sandbox="allow-scripts"'));
    assert.ok(languageLabSource.includes('sandbox=""'));
  });
});
