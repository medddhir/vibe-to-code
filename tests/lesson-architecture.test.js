/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const assert = require("node:assert/strict");
const { test } = require("node:test");

const { courses } = require("../src/data/curriculum.ts");
const { LESSON_CATALOG } = require("../src/data/lesson-catalog.ts");
const {
  LESSON_CONTENT_SCHEMA_VERSION,
  SUPPORTED_LESSON_BLOCK_TYPES,
} = require("../src/data/lesson-schema.ts");
const { getLessonStorageKey } = require("../src/lib/lesson-progress-storage.ts");
const {
  FOUNDATION_CURRICULUM_VERSION,
  FOUNDATION_PROGRESS_MANIFEST,
  FOUNDATION_PROGRESS_SCHEMA_VERSION,
} = require("../src/lib/progress-manifest.ts");
const {
  createLessonRegistry,
  getPublishedLessonBySlug,
  getPublishedLessonCatalogEntries,
} = require("../src/lib/lesson-registry.ts");
const {
  validateLessonCatalog,
  validateLessonContentDefinition,
  validatePublishedLessonRegistry,
} = require("../src/lib/lesson-validation.ts");
const {
  getGuidedStepsForLessonDefinition,
  getLessonBlockRendererKind,
} = require("../src/components/generic-lesson-renderer.tsx");

const publishedSlugs = [
  "what-is-code",
  "source-code-running-output",
  "hardware-operating-systems-apps",
  "files-folders-extensions",
  "paths-current-folder",
  "vscode-without-getting-lost",
  "terminal-without-fear",
  "values-variables-types",
  "decisions-loops-functions",
  "input-process-output-state",
  "languages-syntax-errors",
  "interpreters-compilers-runtimes",
  "packages-dependencies-environments",
  "frontend-backend-api-database-cloud",
];

const published = getPublishedLessonCatalogEntries();
const sampleCatalogEntry = published[0];

const contentFixture = (overrides = {}) => ({
  schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
  lessonSlug: "fixture-lesson",
  objective: "Prove the architecture with local test data.",
  prerequisites: [],
  learningOutcomes: ["Recognize a trusted block."],
  misconception: "Any data can safely become interface code.",
  guidedSteps: [{
    id: "fixture-step",
    title: "Fixture step",
    eyebrow: "Test only",
    blocks: [{ type: "single-answer-checkpoint", activityId: "fixture-check" }],
    requiredActivityIds: ["fixture-check"],
  }],
  activities: [{
    type: "single-answer",
    id: "fixture-check",
    title: "Fixture check",
    question: "Which option is deterministic?",
    options: [
      { id: "a", label: "A", feedback: "Correct." },
      { id: "b", label: "B", feedback: "Try again." },
    ],
    correctOptionId: "a",
    successMessage: "Correct.",
    hint: "Choose A.",
  }],
  completionRule: {
    type: "all-steps-and-required-activities",
    requiredActivityIds: ["fixture-check"],
  },
  sources: [],
  sourceVerifiedAt: null,
  ...overrides,
});

test("keeps the exact 14 published lesson slugs and order", () => {
  assert.deepEqual(published.map((entry) => entry.lessonSlug), publishedSlugs);
  assert.equal(published.length, 14);
  assert.deepEqual(
    published.map((entry) => entry.lessonSlug),
    FOUNDATION_PROGRESS_MANIFEST.map((entry) => entry.slug),
  );
});

test("keeps Lesson 1 public and the other 13 published routes authenticated", () => {
  assert.deepEqual(
    published.filter((entry) => entry.access === "public").map((entry) => entry.route),
    ["/lessons/what-is-code"],
  );
  assert.equal(published.filter((entry) => entry.access === "authenticated").length, 13);
});

test("published lookup never returns draft or planned entries", () => {
  const draft = { ...sampleCatalogEntry, lessonSlug: "draft-fixture", route: null, publicationState: "draft", access: "unavailable" };
  const planned = { ...sampleCatalogEntry, lessonSlug: "planned-fixture", route: null, publicationState: "planned", access: "unavailable" };
  const registry = createLessonRegistry([sampleCatalogEntry, draft, planned]);

  assert.equal(registry.publishedBySlug("draft-fixture"), null);
  assert.equal(registry.publishedBySlug("planned-fixture"), null);
  assert.equal(getPublishedLessonBySlug("what-is-code").lessonSlug, "what-is-code");
});

test("accepts the current catalog and exact published registry", () => {
  assert.deepEqual(validateLessonCatalog(LESSON_CATALOG), []);
  assert.deepEqual(validatePublishedLessonRegistry(LESSON_CATALOG, published), []);
});

test("rejects duplicate lesson slugs, routes, and positions", () => {
  const duplicate = { ...sampleCatalogEntry };
  const issues = validateLessonCatalog([sampleCatalogEntry, duplicate]);
  assert.ok(issues.some((issue) => issue.includes("Duplicate lesson slug")));
  assert.ok(issues.some((issue) => issue.includes("Duplicate lesson route")));
  assert.ok(issues.some((issue) => issue.includes("Duplicate course/level/lesson position")));
});

test("rejects duplicate step and activity IDs", () => {
  const issues = validateLessonCatalog([{
    ...sampleCatalogEntry,
    progressStepIds: ["same", "same"],
    activityIds: ["activity", "activity"],
  }]);
  assert.ok(issues.some((issue) => issue.includes("duplicate step ID")));
  assert.ok(issues.some((issue) => issue.includes("duplicate activity ID")));
});

test("rejects missing required activities", () => {
  const definition = contentFixture({
    completionRule: {
      type: "all-steps-and-required-activities",
      requiredActivityIds: ["missing"],
    },
  });
  assert.ok(validateLessonContentDefinition(definition).some(
    (issue) => issue.includes("requires missing activity ID: missing"),
  ));
});

test("rejects broken navigation relationships", () => {
  const broken = published.map((entry) => ({ ...entry }));
  broken[1].previousLessonSlug = null;
  assert.ok(validateLessonCatalog(broken).some(
    (issue) => issue.includes("broken previous relationship"),
  ));
});

test("rejects invalid publication metadata and missing objectives", () => {
  const issues = validateLessonCatalog([{
    ...sampleCatalogEntry,
    schemaVersion: 99,
    lessonVersion: 0,
    estimatedMinutes: 0,
    title: "",
    publicationState: "preview",
    route: null,
  }]);
  assert.ok(issues.some((issue) => issue.includes("invalid catalog schema version")));
  assert.ok(issues.some((issue) => issue.includes("invalid lesson version")));
  assert.ok(issues.some((issue) => issue.includes("invalid estimated duration")));
  assert.ok(issues.some((issue) => issue.includes("missing a title")));
  assert.ok(issues.some((issue) => issue.includes("invalid publication state")));
  assert.ok(validateLessonContentDefinition(contentFixture({ objective: "" })).some(
    (issue) => issue.includes("missing an objective"),
  ));

  const missingRoute = validateLessonCatalog([{ ...sampleCatalogEntry, route: null }]);
  assert.ok(missingRoute.some((issue) => issue.includes("published without a route")));
});

test("rejects draft or planned entries injected into a published registry", () => {
  const planned = LESSON_CATALOG.find((entry) => entry.publicationState === "planned");
  const issues = validatePublishedLessonRegistry(LESSON_CATALOG, [...published, planned]);
  assert.ok(issues.some((issue) => issue.includes("not published")));
});

test("keeps curriculum, progress versions, identifiers, and storage keys unchanged", () => {
  assert.equal(courses.length, 6);
  assert.equal(courses.reduce((total, course) => total + course.lessonCount, 0), 362);
  assert.equal(FOUNDATION_PROGRESS_SCHEMA_VERSION, 2);
  assert.equal(FOUNDATION_CURRICULUM_VERSION, 2);
  assert.equal(FOUNDATION_PROGRESS_MANIFEST.length, 14);
  assert.deepEqual(
    published.map(({ lessonSlug, lessonVersion, progressStepIds, activityIds }) => ({
      lessonSlug,
      lessonVersion,
      progressStepIds,
      activityIds,
    })),
    FOUNDATION_PROGRESS_MANIFEST.map(({ slug, lessonVersion, stepIds, activityIds }) => ({
      lessonSlug: slug,
      lessonVersion,
      progressStepIds: stepIds,
      activityIds,
    })),
  );
  assert.equal(
    getLessonStorageKey("what-is-code", 3),
    "vibe-to-code:lesson-progress:v1:what-is-code:lesson-v3",
  );
});

test("generic renderer dispatches only the seven trusted block types", () => {
  assert.deepEqual(SUPPORTED_LESSON_BLOCK_TYPES, [
    "explanation",
    "callout",
    "example",
    "single-answer-checkpoint",
    "ordering-checkpoint",
    "recap",
    "transfer-challenge",
  ]);
  SUPPORTED_LESSON_BLOCK_TYPES.forEach((type) => {
    assert.equal(getLessonBlockRendererKind({ type }), type);
  });
  assert.throws(
    () => getLessonBlockRendererKind({ type: "component-name" }),
    /Unsupported lesson block type/,
  );

  const steps = getGuidedStepsForLessonDefinition(contentFixture());
  assert.deepEqual(steps[0].requiredActivityIds, ["fixture-check"]);
  assert.equal(steps[0].requiresPractice, true);

  const unsafe = contentFixture({ rawHtml: "<script>run()</script>" });
  assert.ok(validateLessonContentDefinition(unsafe).some(
    (issue) => issue.includes("rawHtml is not allowed"),
  ));
});
