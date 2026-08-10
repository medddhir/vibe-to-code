/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const lessonPath = (relativePath) => path.join(process.cwd(), relativePath);

const publishedFoundationLessonPaths = [
  "src/app/lessons/what-is-code/page.tsx",
  "src/app/lessons/source-code-running-output/page.tsx",
  "src/app/lessons/hardware-operating-systems-apps/page.tsx",
  "src/app/lessons/files-folders-extensions/page.tsx",
  "src/app/lessons/paths-current-folder/page.tsx",
  "src/app/lessons/vscode-without-getting-lost/page.tsx",
  "src/app/lessons/terminal-without-fear/page.tsx",
  "src/app/lessons/values-variables-types/page.tsx",
  "src/app/lessons/decisions-loops-functions/page.tsx",
  "src/app/lessons/input-process-output-state/page.tsx",
  "src/app/lessons/languages-syntax-errors/page.tsx",
  "src/app/lessons/interpreters-compilers-runtimes/page.tsx",
  "src/app/lessons/packages-dependencies-environments/page.tsx",
  "src/app/lessons/frontend-backend-api-database-cloud/page.tsx",
];

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
const foundationLessonPageSource = fs.readFileSync(
  lessonPath("src/components/foundations/foundation-lesson-page.tsx"),
  "utf8",
);
const foundationCourseProgressPanelSource = fs.readFileSync(
  lessonPath("src/components/foundations/foundation-course-progress-panel.tsx"),
  "utf8",
);
const foundationLessonStateSource = fs.readFileSync(
  lessonPath("src/components/foundations/lesson-state.ts"),
  "utf8",
);
const guidedLessonFlowSource = fs.readFileSync(
  lessonPath("src/components/guided-lesson-flow.tsx"),
  "utf8",
);
const { isStepPracticeActivitiesComplete } = require("../src/components/guided-lesson-flow.tsx");

function extractStepIds(source) {
  return [...source.matchAll(/stepId=\"([^\"]+)\"/g)].map((match) => match[1]);
}

describe("Published Foundation content and interaction regressions", () => {
  it("derives the next Foundation lesson in the shared lesson engine", () => {
    assert.ok(guidedLessonFlowSource.includes("getFoundationLessonJourney"));
    assert.ok(guidedLessonFlowSource.includes("Continue to next lesson"));
    assert.ok(guidedLessonFlowSource.includes("Start ${foundationJourney.next.levelLabel}"));
  });

  it("all published Foundation lesson pages use unique interactive step IDs", () => {
    for (const lesson of publishedFoundationLessonPaths) {
      const source = fs.readFileSync(lessonPath(lesson), "utf8");
      const ids = extractStepIds(source);
      const unique = new Set(ids);

      assert.equal(
        unique.size,
        ids.length,
        `Duplicate interactive step IDs found in ${lesson}: ${ids.filter((value, index, all) => all.indexOf(value) !== index).join(", ")}`,
      );
    }
  });

  it("Lesson 2 loop checkpoints require separate simulator-and-checkpoint completions", () => {
    const ifLogicStep = {
      id: "if-logic",
      requiresPractice: true,
      requiredActivityIds: ["if-logic-simulator", "if-logic-check"],
    };
    assert.equal(isStepPracticeActivitiesComplete(ifLogicStep, []), false);
    assert.equal(isStepPracticeActivitiesComplete(ifLogicStep, ["if-logic-simulator"]), false);
    assert.equal(isStepPracticeActivitiesComplete(ifLogicStep, ["if-logic-check"]), false);
    assert.equal(
      isStepPracticeActivitiesComplete(ifLogicStep, ["if-logic-simulator", "if-logic-check"]),
      true,
    );

    const loopStep = { id: "loop-iteration", requiresPractice: true, requiredActivityIds: ["loop-iteration-simulator", "loop-iteration-check"] };
    assert.equal(isStepPracticeActivitiesComplete(loopStep, []), false);
    assert.equal(isStepPracticeActivitiesComplete(loopStep, ["loop-iteration-simulator"]), false);
    assert.equal(isStepPracticeActivitiesComplete(loopStep, ["loop-iteration-check"]), false);
    assert.equal(isStepPracticeActivitiesComplete(loopStep, ["loop-iteration-simulator", "loop-iteration-check"]), true);

    const brokenLoopStep = {
      id: "broken-loop",
      requiresPractice: true,
      requiredActivityIds: ["broken-loop-simulator", "broken-loop-check"],
    };
    assert.equal(isStepPracticeActivitiesComplete(brokenLoopStep, []), false);
    assert.equal(isStepPracticeActivitiesComplete(brokenLoopStep, ["broken-loop-simulator"]), false);
    assert.equal(isStepPracticeActivitiesComplete(brokenLoopStep, ["broken-loop-check"]), false);
    assert.equal(
      isStepPracticeActivitiesComplete(brokenLoopStep, ["broken-loop-simulator", "broken-loop-check"]),
      true,
    );
  });

  it("Lesson 6 security step requires simulator and checkpoint separately", () => {
    const securityStep = {
      id: "security-verification",
      requiresPractice: true,
      requiredActivityIds: ["security-verification-simulator", "security-verification-check"],
    };
    assert.equal(isStepPracticeActivitiesComplete(securityStep, ["security-verification-simulator"]), false);
    assert.equal(isStepPracticeActivitiesComplete(securityStep, ["security-verification-check"]), false);
    assert.equal(
      isStepPracticeActivitiesComplete(securityStep, ["security-verification-simulator", "security-verification-check"]),
      true,
    );
  });

  it("Lesson 3 state checkpoints require simulator-and-checkpoint completions", () => {
    const stateJourneyStep = {
      id: "state-journey",
      requiresPractice: true,
      requiredActivityIds: ["state-journey-simulator", "state-journey-check"],
    };
    const traceObserveStep = {
      id: "trace-observe",
      requiresPractice: true,
      requiredActivityIds: ["trace-observe-simulator", "trace-observe-check"],
    };
    const predictRepeatStep = {
      id: "predict-repeat",
      requiresPractice: true,
      requiredActivityIds: ["predict-repeat-simulator", "predict-repeat-check"],
    };

    assert.equal(isStepPracticeActivitiesComplete(stateJourneyStep, ["state-journey-simulator"]), false);
    assert.equal(isStepPracticeActivitiesComplete(stateJourneyStep, ["state-journey-check"]), false);
    assert.equal(isStepPracticeActivitiesComplete(traceObserveStep, ["trace-observe-simulator"]), false);
    assert.equal(isStepPracticeActivitiesComplete(traceObserveStep, ["trace-observe-check"]), false);
    assert.equal(isStepPracticeActivitiesComplete(predictRepeatStep, ["predict-repeat-simulator"]), false);
    assert.equal(isStepPracticeActivitiesComplete(predictRepeatStep, ["predict-repeat-check"]), false);
    assert.equal(
      isStepPracticeActivitiesComplete(stateJourneyStep, ["state-journey-simulator", "state-journey-check"]),
      true,
    );
    assert.equal(
      isStepPracticeActivitiesComplete(traceObserveStep, ["trace-observe-simulator", "trace-observe-check"]),
      true,
    );
    assert.equal(
      isStepPracticeActivitiesComplete(predictRepeatStep, ["predict-repeat-simulator", "predict-repeat-check"]),
      true,
    );
  });

  it("Lesson 7 backend and secret checkpoints require simulator-and-checkpoint completions", () => {
    const backendStep = {
      id: "backend-validation",
      requiresPractice: true,
      requiredActivityIds: ["backend-validation-simulator", "backend-validation-check"],
    };
    const secretStep = {
      id: "secret-placement",
      requiresPractice: true,
      requiredActivityIds: ["secret-placement-simulator", "secret-placement-check"],
    };
    assert.equal(isStepPracticeActivitiesComplete(backendStep, ["backend-validation-simulator"]), false);
    assert.equal(isStepPracticeActivitiesComplete(backendStep, ["backend-validation-check"]), false);
    assert.equal(
      isStepPracticeActivitiesComplete(backendStep, ["backend-validation-simulator", "backend-validation-check"]),
      true,
    );
    assert.equal(isStepPracticeActivitiesComplete(secretStep, ["secret-placement-simulator"]), false);
    assert.equal(isStepPracticeActivitiesComplete(secretStep, ["secret-placement-check"]), false);
    assert.equal(
      isStepPracticeActivitiesComplete(secretStep, ["secret-placement-simulator", "secret-placement-check"]),
      true,
    );
  });

  it("Lesson 4 sorting checkpoint marks CSS as correct and keeps question readable", () => {
    assert.ok(lesson4Source.includes("question=\"Where should this line most likely live: body { margin: 0; }\""));
    assert.ok(!lesson4Source.includes("Where should this line most likely live? <code>"));
    assert.ok(lesson4Source.includes('correctId="css"'));
    assert.ok(lesson4Source.includes("Correct. `body { margin: 0; }` is a style rule, so it belongs in CSS."));
  });

  it("Lesson 6 lockfile checkpoint uses a reproducibility-focused correct answer", () => {
    assert.ok(
      /<ChoiceCheckpoint[\s\S]*?stepId=\"project-snapshot\"[\s\S]*?question=\"Why is package-lock\.json usually stored with package\.json\?\"[\s\S]*?correctId=\"lockfile-reproducible\"/m.test(
        lesson6Source,
      ),
    );
    assert.ok(
      lesson6Source.includes(
        "package-lock.json records exact resolved dependency versions and the full dependency tree so installs are repeatable.",
      ),
    );
    assert.ok(lesson6Source.includes("id: \"lockfile-reproducible\""));
    assert.ok(lesson6Source.includes("id: \"package-json\""));
    assert.ok(lesson6Source.includes('correctId="lockfile-reproducible"'));
    assert.ok(lesson6Source.includes("exact resolved versions"));
    assert.ok(lesson6Source.includes("repeatable"));
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

  it("course progress uses a stable external-store snapshot", () => {
    assert.ok(foundationCourseProgressPanelSource.includes("cachedCourseFingerprint"));
    assert.ok(foundationCourseProgressPanelSource.includes("readServerCourseSnapshot"));
    assert.ok(
      /useSyncExternalStore\([\s\S]*?readCourseSnapshot,[\s\S]*?readServerCourseSnapshot,[\s\S]*?\)/m.test(
        foundationCourseProgressPanelSource,
      ),
    );
    assert.ok(
      !foundationCourseProgressPanelSource.includes(
        "useSyncExternalStore(subscribe, readCourseSnapshot, readCourseSnapshot)",
      ),
    );
    assert.ok(
      foundationCourseProgressPanelSource.includes(
        "getLessonRowState(snapshot, slug)",
      ),
    );
  });

  it("lesson access state uses a stable external-store snapshot", () => {
    assert.ok(foundationLessonStateSource.includes("cachedCourseFingerprint"));
    assert.ok(foundationLessonStateSource.includes("readServerSnapshot"));
    assert.ok(
      /useSyncExternalStore\([\s\S]*?readSnapshot,[\s\S]*?readServerSnapshot,[\s\S]*?\)/m.test(
        foundationLessonStateSource,
      ),
    );
    assert.ok(
      !foundationLessonStateSource.includes(
        "useSyncExternalStore(subscribe, readSnapshot, readSnapshot)",
      ),
    );
    assert.ok(
      foundationLessonStateSource.includes(
        "isLessonUnlockedInSnapshot(snapshot, lessonSlug)",
      ),
    );
  });

  it("course lesson lock messaging names the immediate previous lesson", () => {
    assert.ok(foundationLessonPageSource.includes("previousPublishedLesson"));
    assert.ok(foundationLessonPageSource.includes("requiredLessonLabel"));
    assert.ok(foundationLessonPageSource.includes('previousPublishedLesson.title'));
    assert.ok(foundationLessonPageSource.includes("to unlock this lesson."));
    assert.ok(!foundationLessonPageSource.includes("Complete Lesson 1"));
  });

  it("ships all seven Level 0 lesson routes with five gated learning checkpoints each", () => {
    const level0Paths = publishedFoundationLessonPaths.slice(0, 7);

    for (const lesson of level0Paths) {
      const source = fs.readFileSync(lessonPath(lesson), "utf8");
      const declaredSteps = [...source.matchAll(/requiresPractice: true/g)];
      assert.equal(declaredSteps.length >= 5, true, `${lesson} needs at least five gated checkpoints`);
      assert.ok(source.includes('levelTitle="Level 0"') || lesson.endsWith("what-is-code/page.tsx"));
    }
  });
});
