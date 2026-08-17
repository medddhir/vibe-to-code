/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const { courses } = require("../src/data/curriculum.ts");
const { foundationLevels } = require("../src/data/course-content.ts");
const {
  LESSON_CATALOG,
  createLessonCatalog,
  parseLessonDuration,
} = require("../src/data/lesson-catalog.ts");
const {
  createLessonContentRegistry,
  lessonContentRegistry,
} = require("../src/data/lesson-content-registry.ts");
const { LESSON_PUBLICATION_RECORD } = require("../src/data/lesson-publication.ts");
const {
  internetWebBrowserServerLesson,
} = require("../src/data/lessons/foundations/internet-web-browser-server.ts");
const {
  LESSON_CONTENT_SCHEMA_VERSION,
  SUPPORTED_LESSON_BLOCK_TYPES,
} = require("../src/data/lesson-schema.ts");
const { getLessonStorageKey } = require("../src/lib/lesson-progress-storage.ts");
const {
  FOUNDATION_CURRICULUM_VERSION,
  FOUNDATION_PROGRESS_MANIFEST,
  FOUNDATION_PROGRESS_MANIFEST_VERSION_2,
  FOUNDATION_PROGRESS_MANIFEST_VERSION_3,
  FOUNDATION_PROGRESS_LEVEL1_LESSON_SLUGS,
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
  validatePublishableLessonBundle,
  validatePublishedDataDrivenLessons,
  validatePublishedLessonRegistry,
} = require("../src/lib/lesson-validation.ts");
const {
  getChoiceCheckpointDisplayState,
} = require("../src/components/choice-checkpoint.tsx");
const {
  advanceCounterSimulation,
  getCounterSimulationDisplayCount,
  getLessonBlockRendererKind,
  getOrderingCheckpointDisplayOrder,
  getOrderingCheckpointDisplayState,
} = require("../src/components/generic-lesson-renderer.tsx");
const {
  getCourseMapLessonState,
} = require("../src/components/course-overview.tsx");
const {
  getGuidedStepsForLessonDefinition,
} = require("../src/lib/guided-lesson-definition.ts");

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
  "internet-web-browser-server",
  "urls-domains-dns-paths-queries",
  "requests-responses-http-https",
  "browser-developer-tools",
  "first-html-document",
  "meaningful-html-text-links-images-controls",
  "css-selectors-colour-spacing-cascade",
  "box-model-layout-responsive-design",
  "javascript-dom-events",
];

const newLevel2Slugs = publishedSlugs.slice(15);

const published = getPublishedLessonCatalogEntries();
const sampleCatalogEntry = published[0];

const contentFixture = (overrides = {}) => ({
  schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
  lessonSlug: "fixture-lesson",
  lessonVersion: 1,
  objective: "Validate a local architecture fixture.",
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
  sources: [{ title: "Fixture source", url: "https://example.com/reference" }],
  sourceVerifiedAt: "2026-08-16",
  ...overrides,
});

const publishableCatalogFixture = (overrides = {}) => ({
  schemaVersion: 1,
  catalogId: "fixtures:level:0:lesson:0",
  courseSlug: "fixtures",
  levelIndex: 0,
  lessonIndex: 0,
  lessonSlug: "fixture-lesson",
  slugState: "permanent",
  lessonVersion: 1,
  route: "/lessons/fixture-lesson",
  title: "Fixture lesson",
  estimatedMinutes: 10,
  publicationState: "published",
  renderMode: "data-driven",
  access: "authenticated",
  previousLessonSlug: null,
  nextLessonSlug: null,
  progressStepIds: ["fixture-step"],
  activityIds: ["fixture-check"],
  ...overrides,
});

test("keeps the exact 23 explicit publication records, slugs, and order", () => {
  assert.equal(Object.isFrozen(LESSON_PUBLICATION_RECORD), true);
  assert.equal(LESSON_PUBLICATION_RECORD.every(Object.isFrozen), true);
  assert.deepEqual(LESSON_PUBLICATION_RECORD.map((entry) => entry.lessonSlug), publishedSlugs);
  assert.deepEqual(published.map((entry) => entry.lessonSlug), publishedSlugs);
  assert.deepEqual(
    LESSON_PUBLICATION_RECORD.map((entry) => entry.lessonSlug),
    FOUNDATION_PROGRESS_MANIFEST.map((entry) => entry.slug),
  );
  assert.equal(published.length, 23);
});

test("a progress-manifest entry alone cannot publish a lesson", () => {
  const plannedCatalogEntry = LESSON_CATALOG.find((entry) => entry.publicationState === "planned");
  const fakeManifestEntry = {
    slug: plannedCatalogEntry.lessonSlug,
    lessonVersion: 1,
    stepIds: ["manifest-step"],
    activityIds: [],
  };
  const catalog = createLessonCatalog(
    courses,
    LESSON_PUBLICATION_RECORD,
    [...FOUNDATION_PROGRESS_MANIFEST, fakeManifestEntry],
  );
  const plannedLesson = catalog.find((entry) => entry.catalogId === plannedCatalogEntry.catalogId);

  assert.equal(catalog.filter((entry) => entry.publicationState === "published").length, 23);
  assert.deepEqual(plannedLesson.progressStepIds, []);
  assert.deepEqual(plannedLesson.activityIds, []);
  assert.equal(plannedLesson.publicationState, "planned");
  assert.equal(plannedLesson.route, null);
  assert.equal(plannedLesson.access, "unavailable");
  assert.equal(plannedLesson.previousLessonSlug, null);
  assert.equal(plannedLesson.nextLessonSlug, null);
});

test("keeps Lesson 1 public and the other 22 published routes authenticated", () => {
  assert.deepEqual(
    published.filter((entry) => entry.access === "public").map((entry) => entry.route),
    ["/lessons/what-is-code"],
  );
  assert.equal(published.filter((entry) => entry.access === "authenticated").length, 22);
  assert.deepEqual(validateLessonCatalog(LESSON_CATALOG), []);
});

test("construction rejects a second public lesson or authenticating what-is-code", () => {
  const secondPublic = LESSON_PUBLICATION_RECORD.map((record) =>
    record.lessonSlug === "source-code-running-output"
      ? { ...record, access: "public" }
      : record,
  );
  const publicRemoved = LESSON_PUBLICATION_RECORD.map((record) =>
    record.lessonSlug === "what-is-code"
      ? { ...record, access: "authenticated" }
      : record,
  );
  assert.throws(
    () => createLessonCatalog(courses, secondPublic, FOUNDATION_PROGRESS_MANIFEST),
    /only public lesson/,
  );
  assert.throws(
    () => createLessonCatalog(courses, publicRemoved, FOUNDATION_PROGRESS_MANIFEST),
    /only public lesson/,
  );
});

test("construction rejects duplicate publication identity before Map construction", () => {
  const duplicate = [
    ...LESSON_PUBLICATION_RECORD,
    {
      ...LESSON_PUBLICATION_RECORD[0],
      access: "authenticated",
    },
  ];
  assert.throws(
    () => createLessonCatalog(courses, duplicate, FOUNDATION_PROGRESS_MANIFEST),
    /Duplicate publication catalog ID: foundations:level:0:lesson:0/,
  );

  const duplicateSlug = LESSON_PUBLICATION_RECORD.map((record, index) =>
    index === 1 ? { ...record, lessonSlug: LESSON_PUBLICATION_RECORD[0].lessonSlug } : record,
  );
  assert.throws(
    () => createLessonCatalog(courses, duplicateSlug, FOUNDATION_PROGRESS_MANIFEST),
    /Duplicate publication lesson slug: what-is-code/,
  );

  const duplicateRoute = LESSON_PUBLICATION_RECORD.map((record, index) =>
    index === 1 ? { ...record, route: LESSON_PUBLICATION_RECORD[0].route } : record,
  );
  assert.throws(
    () => createLessonCatalog(courses, duplicateRoute, FOUNDATION_PROGRESS_MANIFEST),
    /Duplicate publication route: \/lessons\/what-is-code/,
  );
});

test("catalog and bundle validators reject authorization-contract drift", () => {
  const secondPublic = LESSON_CATALOG.map((entry) =>
    entry.lessonSlug === "source-code-running-output" ? { ...entry, access: "public" } : entry,
  );
  const publicRemoved = LESSON_CATALOG.map((entry) =>
    entry.lessonSlug === "what-is-code" ? { ...entry, access: "authenticated" } : entry,
  );
  assert.ok(validateLessonCatalog(secondPublic).some((issue) => issue.includes("second public")));
  assert.ok(validateLessonCatalog(publicRemoved).some((issue) => issue.includes("what-is-code")));

  const futurePublic = publishableCatalogFixture({ access: "public" });
  const registry = createLessonContentRegistry([contentFixture()]);
  assert.ok(validatePublishableLessonBundle(futurePublic, registry).some(
    (issue) => issue.includes("Only what-is-code"),
  ));
});

test("keeps 362 declared, 202 cataloged, 23 published, and 179 planned lessons", () => {
  assert.equal(courses.length, 6);
  assert.equal(courses.reduce((total, course) => total + course.lessonCount, 0), 362);
  assert.equal(LESSON_CATALOG.length, 202);
  assert.equal(LESSON_CATALOG.filter((entry) => entry.publicationState === "published").length, 23);
  assert.equal(LESSON_CATALOG.filter((entry) => entry.publicationState === "planned").length, 179);
});

test("README and product facts describe the complete 23-lesson Foundation path", () => {
  const readme = fs.readFileSync(path.join(process.cwd(), "README.md"), "utf8");
  const product = fs.readFileSync(path.join(process.cwd(), "PRODUCT.md"), "utf8");
  assert.match(readme, /23 Developer Foundations lessons are published/);
  assert.match(readme, /Lesson 1 is public; the other 22 require a free Vibe to Code account with Google sign-in/);
  assert.match(product, /Level 0, Level 1, and the complete Level 2 as a sequential 23-lesson path/);
  assert.doesNotMatch(readme, /15 Developer Foundations lessons are published/);
  assert.doesNotMatch(product, /Level 2 Lesson 1 as a sequential 15-lesson path/);
});

test("publishes all nine Foundation Level 2 lessons through authenticated data-driven records", () => {
  const level2 = LESSON_CATALOG.filter(
    (entry) => entry.courseSlug === "foundations" && entry.levelIndex === 2,
  );
  assert.equal(level2.length, 9);
  assert.deepEqual(
    level2.filter((entry) => entry.publicationState === "published").map((entry) => entry.lessonSlug),
    publishedSlugs.slice(14),
  );
  assert.equal(level2.filter((entry) => entry.publicationState === "planned").length, 0);
  assert.equal(
    level2.every((entry) => entry.route === `/lessons/${entry.lessonSlug}` && entry.access === "authenticated"),
    true,
  );
});

test("course maps link only registry-published positions through canonical routes", () => {
  assert.deepEqual(getCourseMapLessonState("foundations", 2, 0), {
    label: "Start",
    route: "/lessons/internet-web-browser-server",
  });

  assert.deepEqual(getCourseMapLessonState("foundations", 2, 1), {
    label: "Start",
    route: "/lessons/urls-domains-dns-paths-queries",
  });

  const planned = LESSON_CATALOG.find((entry) => entry.publicationState === "planned");
  const clonedCourses = structuredClone(courses);
  clonedCourses[planned.courseSlug === "foundations" ? 0 : courses.findIndex((course) => course.slug === planned.courseSlug)]
    .levels[planned.levelIndex].lessons[planned.lessonIndex].slug = "plausible-permanent-looking-slug";
  const catalog = createLessonCatalog(clonedCourses, LESSON_PUBLICATION_RECORD, FOUNDATION_PROGRESS_MANIFEST);
  const stillPlanned = catalog.find((entry) => entry.catalogId === planned.catalogId);
  assert.equal(stillPlanned.publicationState, "planned");
  assert.equal(stillPlanned.route, null);
  assert.equal(stillPlanned.access, "unavailable");

  assert.deepEqual(
    published.map((entry) => entry.route),
    publishedSlugs.map((slug) => `/lessons/${slug}`),
  );
});

test("uses permanent approved slugs for the complete Foundation Level 2 path", () => {
  assert.equal(published.every((entry) => entry.slugState === "permanent"), true);
  const lesson15 = LESSON_CATALOG.find(
    (entry) => entry.courseSlug === "foundations" && entry.levelIndex === 2 && entry.lessonIndex === 0,
  );
  assert.equal(lesson15.catalogId, "foundations:level:2:lesson:0");
  assert.equal(lesson15.slugState, "permanent");
  assert.equal(lesson15.lessonSlug, "internet-web-browser-server");
  assert.equal(lesson15.publicationState, "published");
  assert.deepEqual(
    LESSON_CATALOG.filter((entry) => entry.courseSlug === "foundations" && entry.levelIndex === 2)
      .map((entry) => entry.lessonSlug),
    publishedSlugs.slice(14),
  );
});

test("reserved provisional placeholders cannot become permanent, draft, or published", () => {
  const lesson16 = LESSON_CATALOG.find((entry) => entry.publicationState === "planned");
  for (const candidate of [
    { ...lesson16, slugState: "permanent" },
    { ...lesson16, slugState: "permanent", publicationState: "draft" },
    { ...lesson16, slugState: "permanent", publicationState: "published", route: `/lessons/${lesson16.lessonSlug}`, access: "authenticated" },
  ]) {
    assert.ok(validateLessonCatalog([sampleCatalogEntry, candidate]).some(
      (issue) => issue.includes("reserved provisional placeholder"),
    ));
  }

  const attemptedPublication = [...LESSON_PUBLICATION_RECORD, {
    courseSlug: lesson16.courseSlug,
    levelIndex: lesson16.levelIndex,
    lessonIndex: lesson16.lessonIndex,
    lessonSlug: lesson16.lessonSlug,
    route: `/lessons/${lesson16.lessonSlug}`,
    renderMode: "data-driven",
    access: "authenticated",
  }];
  assert.throws(
    () => createLessonCatalog(courses, attemptedPublication, [
      ...FOUNDATION_PROGRESS_MANIFEST,
      { slug: lesson16.lessonSlug, lessonVersion: 1, stepIds: [], activityIds: [] },
    ]),
    /Reserved provisional slug/,
  );
});

test("catalog construction builds independent ordered navigation per course", () => {
  const course = (slug, lessons) => ({
    slug,
    name: slug,
    shortName: slug,
    eyebrow: slug,
    description: slug,
    status: "In progress",
    accent: "blue",
    lessonCount: lessons.length,
    levelCount: 1,
    levels: [{ label: "Level 0", title: "Level", description: "Level", lessons }],
  });
  const syntheticCourses = [
    course("foundations", [{ title: "Public", slug: "what-is-code", duration: "10 min" }]),
    course("second-course", [
      { title: "First", slug: "second-first", duration: "10 min" },
      { title: "Second", slug: "second-second", duration: "12 min" },
    ]),
  ];
  const syntheticPublications = [
    { courseSlug: "foundations", levelIndex: 0, lessonIndex: 0, lessonSlug: "what-is-code", route: "/lessons/what-is-code", renderMode: "legacy-bespoke", access: "public" },
    { courseSlug: "second-course", levelIndex: 0, lessonIndex: 0, lessonSlug: "second-first", route: "/lessons/second-first", renderMode: "data-driven", access: "authenticated" },
    { courseSlug: "second-course", levelIndex: 0, lessonIndex: 1, lessonSlug: "second-second", route: "/lessons/second-second", renderMode: "data-driven", access: "authenticated" },
  ];
  const syntheticManifest = syntheticPublications.map((entry) => ({
    slug: entry.lessonSlug,
    lessonVersion: 1,
    stepIds: [],
    activityIds: [],
  }));
  const catalog = createLessonCatalog(syntheticCourses, syntheticPublications, syntheticManifest);
  const foundation = catalog.find((entry) => entry.lessonSlug === "what-is-code");
  const first = catalog.find((entry) => entry.lessonSlug === "second-first");
  const second = catalog.find((entry) => entry.lessonSlug === "second-second");

  assert.equal(foundation.previousLessonSlug, null);
  assert.equal(foundation.nextLessonSlug, null);
  assert.equal(first.previousLessonSlug, null);
  assert.equal(first.nextLessonSlug, "second-second");
  assert.equal(second.previousLessonSlug, "second-first");
  assert.equal(second.nextLessonSlug, null);
  assert.deepEqual(validateLessonCatalog(catalog), []);
});

test("parses only exact whole-minute durations and standardizes Lesson 1 to 10 minutes", () => {
  assert.equal(parseLessonDuration("10 min"), 10);
  for (const invalid of ["10.5 min", "12 nonsense", "unknown", "", " 10 min", 10]) {
    assert.throws(() => parseLessonDuration(invalid), /duration/i);
  }
  assert.equal(foundationLevels[0].lessons[0].duration, "10 min");
  assert.equal(getPublishedLessonBySlug("what-is-code").estimatedMinutes, 10);
});

test("published lookup never returns draft or planned entries", () => {
  const draft = { ...sampleCatalogEntry, catalogId: "fixtures:level:0:lesson:0", courseSlug: "fixtures", levelIndex: 0, lessonIndex: 0, lessonSlug: "draft-fixture", route: null, publicationState: "draft", access: "unavailable" };
  const planned = { ...draft, catalogId: "fixtures:level:0:lesson:1", lessonIndex: 1, lessonSlug: "planned-fixtures-level-0-lesson-1", slugState: "provisional", publicationState: "planned" };
  const registry = createLessonRegistry([sampleCatalogEntry, draft, planned]);
  assert.equal(registry.publishedBySlug("draft-fixture"), null);
  assert.equal(registry.publishedBySlug("planned-fixtures-level-0-lesson-1"), null);
});

test("registry snapshots cannot be changed through original input or returned entries", () => {
  const original = publishableCatalogFixture();
  const registry = createLessonRegistry([original]);
  original.publicationState = "planned";
  original.route = null;
  original.progressStepIds.push("corrupt-step");
  original.activityIds.push("corrupt-activity");

  const snapshot = registry.publishedBySlug("fixture-lesson");
  assert.equal(registry.published().length, 1);
  assert.equal(snapshot.publicationState, "published");
  assert.equal(snapshot.route, "/lessons/fixture-lesson");
  assert.deepEqual(snapshot.progressStepIds, ["fixture-step"]);
  assert.deepEqual(snapshot.activityIds, ["fixture-check"]);
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.progressStepIds), true);
  assert.equal(Object.isFrozen(snapshot.activityIds), true);
});

test("catalog validator accepts current data and rejects malformed identity and metadata", () => {
  assert.deepEqual(validateLessonCatalog(LESSON_CATALOG), []);
  const malformed = {
    ...sampleCatalogEntry,
    catalogId: "wrong",
    courseSlug: " ",
    levelIndex: -1,
    lessonIndex: 1.5,
    lessonSlug: "Bad/Slug",
    slugState: "temporary",
    lessonVersion: 0,
    route: "lessons/no-leading-slash?x=1",
    title: "",
    estimatedMinutes: Infinity,
    publicationState: "preview",
    renderMode: "component-name",
    access: "everyone",
    progressStepIds: ["", "same", "same"],
    activityIds: null,
  };
  const issues = validateLessonCatalog([malformed]);
  for (const expected of [
    "catalogId", "courseSlug", "levelIndex", "lessonIndex", "lessonSlug",
    "slugState", "lessonVersion", "route", "title", "estimatedMinutes",
    "publicationState", "renderMode", "access", "duplicate ID", "activityIds must be an array",
  ]) assert.ok(issues.some((issue) => issue.includes(expected)), expected);
});

test("catalog validator rejects duplicate slugs, routes, positions, IDs, and broken navigation", () => {
  const duplicate = { ...sampleCatalogEntry };
  const issues = validateLessonCatalog([sampleCatalogEntry, duplicate]);
  assert.ok(issues.some((issue) => issue.includes("Duplicate lesson slug")));
  assert.ok(issues.some((issue) => issue.includes("Duplicate lesson route")));
  assert.ok(issues.some((issue) => issue.includes("Duplicate course/level/lesson position")));
  assert.ok(issues.some((issue) => issue.includes("Duplicate catalog ID")));

  const broken = published.map((entry) => ({ ...entry }));
  broken[1].previousLessonSlug = null;
  assert.ok(validateLessonCatalog(broken).some((issue) => issue.includes("broken previous")));
});

test("validators are total and fail closed for arbitrary missing runtime structures", () => {
  const malformedInputs = [undefined, null, true, 3, "lesson", {}, { guidedSteps: null }];
  malformedInputs.forEach((input) => {
    assert.doesNotThrow(() => validateLessonCatalog(input));
    assert.doesNotThrow(() => validateLessonContentDefinition(input));
    assert.ok(validateLessonContentDefinition(input).length > 0);
  });
});

test("content validator rejects every non-serializable runtime value without recursion overflow", () => {
  const cases = [
    ["undefined", undefined],
    ["bigint", 1n],
    ["symbol", Symbol("unsafe")],
    ["function", () => true],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["non-plain", new Date()],
  ];
  for (const [name, value] of cases) {
    const definition = contentFixture({ unsafeValue: value });
    const issues = validateLessonContentDefinition(definition);
    assert.ok(issues.length > 0, name);
  }
  const cyclic = contentFixture();
  cyclic.cycle = cyclic;
  assert.doesNotThrow(() => validateLessonContentDefinition(cyclic));
  assert.ok(validateLessonContentDefinition(cyclic).some((issue) => issue.includes("cyclic")));
});

test("array serializability rejects hidden own properties, accessors, cycles, and holes", () => {
  const cases = [];

  const functionProperty = [];
  functionProperty.evil = () => 1;
  cases.push(["function property", functionProperty]);

  const bigintProperty = [];
  bigintProperty.evil = 1n;
  cases.push(["bigint property", bigintProperty]);

  const symbolProperty = [];
  symbolProperty[Symbol("evil")] = "x";
  cases.push(["symbol property", symbolProperty]);

  const forbiddenProperty = [];
  forbiddenProperty.rawHtml = "<script>";
  cases.push(["forbidden property", forbiddenProperty]);

  const cyclicProperty = [];
  cyclicProperty.self = cyclicProperty;
  cases.push(["cyclic property", cyclicProperty]);

  let getterInvoked = false;
  const accessorProperty = [];
  Object.defineProperty(accessorProperty, "evil", {
    enumerable: true,
    get() {
      getterInvoked = true;
      return "x";
    },
  });
  cases.push(["accessor property", accessorProperty]);

  cases.push(["sparse array", new Array(1)]);

  for (const [name, array] of cases) {
    const definition = contentFixture({ prerequisites: array });
    assert.doesNotThrow(() => validateLessonContentDefinition(definition), name);
    assert.ok(validateLessonContentDefinition(definition).length > 0, name);
    assert.throws(
      () => createLessonContentRegistry([definition]),
      /Lesson architecture validation failed/,
      name,
    );
  }
  assert.equal(getterInvoked, false);
  assert.deepEqual(validateLessonContentDefinition(contentFixture()), []);
});

test("array validation never executes own or inherited iterators and getters", () => {
  let ownIteratorGetterCalls = 0;
  const ownIteratorGetter = ["safe"];
  Object.defineProperty(ownIteratorGetter, Symbol.iterator, {
    get() {
      ownIteratorGetterCalls += 1;
      return Array.prototype[Symbol.iterator];
    },
  });

  let ownIteratorCalls = 0;
  const ownIteratorFunction = ["safe"];
  Object.defineProperty(ownIteratorFunction, Symbol.iterator, {
    value() {
      ownIteratorCalls += 1;
      return Array.prototype[Symbol.iterator].call(this);
    },
  });

  let inheritedIteratorGetterCalls = 0;
  const inheritedIteratorGetterPrototype = Object.create(Array.prototype);
  Object.defineProperty(inheritedIteratorGetterPrototype, Symbol.iterator, {
    get() {
      inheritedIteratorGetterCalls += 1;
      return Array.prototype[Symbol.iterator];
    },
  });
  const inheritedIteratorGetter = ["safe"];
  Object.setPrototypeOf(inheritedIteratorGetter, inheritedIteratorGetterPrototype);

  let deceptiveIteratorCalls = 0;
  const deceptiveIteratorPrototype = Object.create(Array.prototype);
  Object.defineProperty(deceptiveIteratorPrototype, Symbol.iterator, {
    value() {
      deceptiveIteratorCalls += 1;
      return ["valid-looking prerequisite"][Symbol.iterator]();
    },
  });
  const deceptiveIterator = [123];
  Object.setPrototypeOf(deceptiveIterator, deceptiveIteratorPrototype);

  let inheritedNumericGetterCalls = 0;
  const inheritedNumericPrototype = Object.create(Array.prototype);
  Object.defineProperty(inheritedNumericPrototype, "0", {
    get() {
      inheritedNumericGetterCalls += 1;
      return "valid-looking prerequisite";
    },
  });
  const inheritedNumericGetter = new Array(1);
  Object.setPrototypeOf(inheritedNumericGetter, inheritedNumericPrototype);

  const cases = [
    ["own Symbol.iterator getter", ownIteratorGetter],
    ["own Symbol.iterator function", ownIteratorFunction],
    ["inherited Symbol.iterator getter", inheritedIteratorGetter],
    ["deceptive inherited iterator", deceptiveIterator],
    ["inherited numeric getter", inheritedNumericGetter],
  ];
  for (const [name, array] of cases) {
    const definition = contentFixture({ prerequisites: array });
    assert.doesNotThrow(() => validateLessonContentDefinition(definition), name);
    assert.ok(validateLessonContentDefinition(definition).length > 0, name);
    assert.throws(
      () => createLessonContentRegistry([definition]),
      /Lesson architecture validation failed/,
      name,
    );
  }

  assert.equal(ownIteratorGetterCalls, 0);
  assert.equal(ownIteratorCalls, 0);
  assert.equal(inheritedIteratorGetterCalls, 0);
  assert.equal(deceptiveIteratorCalls, 0);
  assert.equal(inheritedNumericGetterCalls, 0);
});

test("array validation rejects large sparse arrays without expanding them", () => {
  const largeSparse = new Array(2 ** 32 - 1);
  const definition = contentFixture({ prerequisites: largeSparse });
  const issues = validateLessonContentDefinition(definition);
  assert.ok(issues.some((issue) => issue.includes("sparse array")));
  assert.throws(
    () => createLessonContentRegistry([definition]),
    /Lesson architecture validation failed/,
  );
  assert.deepEqual(validateLessonContentDefinition(contentFixture()), []);
});

test("clone parity rejects non-enumerable lesson fields and array indexes", () => {
  const rootSlug = contentFixture();
  Object.defineProperty(rootSlug, "lessonSlug", {
    value: rootSlug.lessonSlug,
    enumerable: false,
  });

  const rootObjective = contentFixture();
  Object.defineProperty(rootObjective, "objective", {
    value: rootObjective.objective,
    enumerable: false,
  });

  const nestedTitle = contentFixture();
  Object.defineProperty(nestedTitle.guidedSteps[0], "title", {
    value: nestedTitle.guidedSteps[0].title,
    enumerable: false,
  });

  const hiddenIndex = ["Visible only by direct indexing"];
  Object.defineProperty(hiddenIndex, "0", {
    value: hiddenIndex[0],
    enumerable: false,
  });
  const arrayIndex = contentFixture({ prerequisites: hiddenIndex });

  const cases = [
    ["root lessonSlug", rootSlug],
    ["root objective", rootObjective],
    ["nested guided step title", nestedTitle],
    ["array index", arrayIndex],
  ];
  for (const [name, definition] of cases) {
    const issues = validateLessonContentDefinition(definition);
    assert.ok(issues.some((issue) => issue.includes("must be enumerable")), name);
    assert.throws(
      () => createLessonContentRegistry([definition]),
      /Lesson architecture validation failed/,
      name,
    );
  }
});

test("every accepted registry clone revalidates and is keyed by its stored slug", () => {
  const definitions = [
    contentFixture(),
    contentFixture({ lessonSlug: "second-fixture-lesson" }),
  ];
  const registry = createLessonContentRegistry(definitions);
  assert.equal(registry.all().length, 2);
  registry.all().forEach((snapshot, index) => {
    assert.deepEqual(snapshot, definitions[index]);
    assert.deepEqual(validateLessonContentDefinition(snapshot), []);
    assert.equal(registry.bySlug(snapshot.lessonSlug), snapshot);
    assert.equal(Object.isFrozen(snapshot), true);
  });
});

test("sparse publishable arrays fail closed in content and bundle validation", () => {
  const sparse = contentFixture({
    learningOutcomes: new Array(1),
    guidedSteps: new Array(1),
    activities: [],
    completionRule: { type: "all-steps-and-required-activities", requiredActivityIds: [] },
    sources: new Array(1),
    sourceVerifiedAt: "2026-08-16",
  });
  const contentIssues = validateLessonContentDefinition(sparse);
  assert.ok(contentIssues.some((issue) => issue.includes("learningOutcomes[0]") && issue.includes("sparse")));
  assert.ok(contentIssues.some((issue) => issue.includes("guidedSteps[0]") && issue.includes("sparse")));
  assert.ok(contentIssues.some((issue) => issue.includes("sources[0]") && issue.includes("sparse")));

  const bundleIssues = validatePublishableLessonBundle(
    publishableCatalogFixture({ progressStepIds: [], activityIds: [] }),
    { bySlug: () => sparse },
  );
  assert.ok(bundleIssues.some((issue) => issue.includes("learningOutcomes[0]")));
  assert.ok(bundleIssues.some((issue) => issue.includes("guidedSteps[0]")));
  assert.ok(bundleIssues.some((issue) => issue.includes("sources[0]")));
  assert.ok(bundleIssues.some((issue) => issue.includes("real guided step")));
  assert.ok(bundleIssues.some((issue) => issue.includes("at least one source")));
});

test("content validator rejects invalid structure, discriminants, blanks, and undersized activities", () => {
  const malformed = contentFixture({
    objective: "",
    learningOutcomes: [""],
    misconception: " ",
    guidedSteps: [{ id: "", title: "", eyebrow: "", blocks: [], requiredActivityIds: null }],
    activities: [
      { type: "single-answer", id: "one", title: "", question: "", options: [{ id: "", label: "", feedback: "" }], correctOptionId: "missing", successMessage: "", hint: "" },
      { type: "ordering", id: "order", title: "Order", prompt: "Order", items: [{ id: "x", label: "X" }], correctOrder: ["x", "x"], successMessage: "Yes", errorMessage: "No" },
      { type: "unknown", id: "bad", title: "Bad" },
    ],
    completionRule: { type: "anything", requiredActivityIds: null },
  });
  const issues = validateLessonContentDefinition(malformed);
  for (const expected of [
    "objective", "learningOutcomes", "misconception", "guidedSteps[0].id",
    "blocks must not be empty", "requiredActivityIds must be an array",
    "at least two options", "at least two items", "correctOrder", "activities[2].type",
    "completionRule.type",
  ]) assert.ok(issues.some((issue) => issue.includes(expected)), expected);

  assert.ok(validateLessonContentDefinition(contentFixture({ guidedSteps: [] })).some(
    (issue) => issue.includes("guidedSteps must not be empty"),
  ));
});

test("content validator rejects unsupported or unsafe block data", () => {
  const unsupported = contentFixture({
    guidedSteps: [{ id: "fixture-step", title: "Step", eyebrow: "Test", blocks: [{ type: "component-name", componentName: "Unsafe" }], requiredActivityIds: [] }],
    activities: [],
    completionRule: { type: "all-steps-and-required-activities", requiredActivityIds: [] },
    rawHtml: "<script>run()</script>",
  });
  const issues = validateLessonContentDefinition(unsupported);
  assert.ok(issues.some((issue) => issue.includes("componentName is not allowed")));
  assert.ok(issues.some((issue) => issue.includes("rawHtml is not allowed")));
  assert.ok(issues.some((issue) => issue.includes("blocks[0].type is invalid")));
});

test("activity validation enforces type compatibility and exactly-once rendering", () => {
  const wrongType = contentFixture({
    guidedSteps: [{ id: "fixture-step", title: "Step", eyebrow: "Test", blocks: [{ type: "ordering-checkpoint", activityId: "fixture-check" }], requiredActivityIds: ["fixture-check"] }],
  });
  assert.ok(validateLessonContentDefinition(wrongType).some((issue) => issue.includes("checkpoint type does not match")));

  const duplicateRender = contentFixture({
    guidedSteps: [{ id: "fixture-step", title: "Step", eyebrow: "Test", blocks: [
      { type: "single-answer-checkpoint", activityId: "fixture-check" },
      { type: "single-answer-checkpoint", activityId: "fixture-check" },
    ], requiredActivityIds: ["fixture-check"] }],
  });
  assert.ok(validateLessonContentDefinition(duplicateRender).some((issue) => issue.includes("rendered more than once")));

  const unknown = contentFixture({
    guidedSteps: [{ id: "fixture-step", title: "Step", eyebrow: "Test", blocks: [{ type: "single-answer-checkpoint", activityId: "unknown" }], requiredActivityIds: [] }],
  });
  assert.ok(validateLessonContentDefinition(unknown).some((issue) => issue.includes("unknown activity")));

  const invalidCounter = contentFixture({
    guidedSteps: [{ id: "fixture-step", title: "Step", eyebrow: "Test", blocks: [{ type: "counter-simulation", activityId: "fixture-counter" }], requiredActivityIds: ["fixture-counter"] }],
    activities: [{
      type: "counter-simulation",
      id: "fixture-counter",
      title: "Counter",
      instruction: "Add one twice.",
      buttonLabel: "Add one",
      initialCount: 2,
      targetCount: 2,
      successMessage: "Done.",
    }],
    completionRule: { type: "all-steps-and-required-activities", requiredActivityIds: ["fixture-counter"] },
  });
  assert.ok(validateLessonContentDefinition(invalidCounter).some(
    (issue) => issue.includes("targetCount must be greater"),
  ));
});

test("activity validation rejects unreachable and cross-step required activities", () => {
  const unreachable = contentFixture({
    guidedSteps: [{ id: "fixture-step", title: "Step", eyebrow: "Test", blocks: [{ type: "recap", heading: "Recap", points: ["Point"] }], requiredActivityIds: ["fixture-check"] }],
  });
  const unreachableIssues = validateLessonContentDefinition(unreachable);
  assert.ok(unreachableIssues.some((issue) => issue.includes("no rendered checkpoint")));
  assert.ok(unreachableIssues.some((issue) => issue.includes("unreachable activity")));

  const crossStep = contentFixture({
    guidedSteps: [
      { id: "first", title: "First", eyebrow: "Test", blocks: [{ type: "recap", heading: "Recap", points: ["Point"] }], requiredActivityIds: ["fixture-check"] },
      { id: "second", title: "Second", eyebrow: "Test", blocks: [{ type: "single-answer-checkpoint", activityId: "fixture-check" }], requiredActivityIds: [] },
    ],
  });
  assert.ok(validateLessonContentDefinition(crossStep).some((issue) => issue.includes("rendered in step second")));
});

test("valid publishable data-driven bundles cross-check catalog, content, registry, and sources", () => {
  const definition = contentFixture();
  const registry = createLessonContentRegistry([definition]);
  assert.deepEqual(validatePublishableLessonBundle(publishableCatalogFixture(), registry), []);
});

test("trusted content registry rejects duplicate slugs regardless of input order", () => {
  const first = contentFixture({ objective: "First valid objective." });
  const second = contentFixture({ objective: "Second valid objective." });
  for (const definitions of [[first, second], [second, first]]) {
    assert.throws(
      () => createLessonContentRegistry(definitions),
      /Duplicate trusted lesson content slug: fixture-lesson/,
    );
  }
  assert.equal(lessonContentRegistry.all().length, 9);
  assert.equal(
    lessonContentRegistry.all()[0].lessonSlug,
    "internet-web-browser-server",
  );
  assert.equal(lessonContentRegistry.bySlug("fixture-lesson"), null);
});

test("trusted content registry validates first and returns immutable cloned definitions", () => {
  const original = contentFixture();
  const registry = createLessonContentRegistry([original]);
  original.objective = "Mutated";
  original.guidedSteps[0].title = "Mutated";
  const snapshot = registry.bySlug("fixture-lesson");
  assert.equal(snapshot.objective, "Validate a local architecture fixture.");
  assert.equal(snapshot.guidedSteps[0].title, "Fixture step");
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.guidedSteps), true);
  assert.equal(Object.isFrozen(snapshot.guidedSteps[0]), true);

  const cyclic = contentFixture();
  cyclic.self = cyclic;
  assert.throws(() => createLessonContentRegistry([cyclic]), /cyclic reference/);
});

test("publishable bundle validation fails closed on missing or mismatched trusted content", () => {
  assert.ok(validatePublishableLessonBundle(publishableCatalogFixture(), createLessonContentRegistry([])).some(
    (issue) => issue.includes("missing"),
  ));
  const mismatchedRegistry = { bySlug: () => contentFixture({ lessonSlug: "different", lessonVersion: 2 }) };
  const issues = validatePublishableLessonBundle(publishableCatalogFixture(), mismatchedRegistry);
  assert.ok(issues.some((issue) => issue.includes("slugs do not match")));
  assert.ok(issues.some((issue) => issue.includes("versions do not match")));
});

test("publishable bundle validation requires exact ordered progress IDs", () => {
  const definition = contentFixture();
  const registry = createLessonContentRegistry([definition]);
  assert.ok(validatePublishableLessonBundle(
    publishableCatalogFixture({ progressStepIds: ["other"], activityIds: ["other"] }),
    registry,
  ).some((issue) => issue.includes("step IDs")));
  assert.ok(validatePublishableLessonBundle(
    publishableCatalogFixture({ progressStepIds: ["other"], activityIds: ["other"] }),
    registry,
  ).some((issue) => issue.includes("activity IDs")));
});

test("publishable bundle validation requires outcomes, HTTPS sources, and a real date", () => {
  const invalid = contentFixture({
    learningOutcomes: [],
    sources: [{ title: "", url: "http://example.com" }],
    sourceVerifiedAt: "2026-02-30",
  });
  const registry = { bySlug: () => invalid };
  const issues = validatePublishableLessonBundle(publishableCatalogFixture(), registry);
  assert.ok(issues.some((issue) => issue.includes("learning outcome")));
  assert.ok(issues.some((issue) => issue.includes("sources[0].title")));
  assert.ok(issues.some((issue) => issue.includes("absolute HTTPS")));
  assert.ok(issues.some((issue) => issue.includes("real YYYY-MM-DD")));
});

test("every published data-driven entry must have trusted valid content", () => {
  assert.deepEqual(validatePublishedDataDrivenLessons(LESSON_CATALOG, lessonContentRegistry), []);
  const future = publishableCatalogFixture();
  assert.ok(validatePublishedDataDrivenLessons([future], createLessonContentRegistry([])).some(
    (issue) => issue.includes("missing"),
  ));
});

test("published registry rejects draft/planned injection and malformed containers", () => {
  assert.deepEqual(validatePublishedLessonRegistry(LESSON_CATALOG, published), []);
  const planned = LESSON_CATALOG.find((entry) => entry.publicationState === "planned");
  assert.ok(validatePublishedLessonRegistry(LESSON_CATALOG, [...published, planned]).some(
    (issue) => issue.includes("not published"),
  ));
  assert.doesNotThrow(() => validatePublishedLessonRegistry(null, null));
  assert.ok(validatePublishedLessonRegistry(null, null).length > 0);
});

test("keeps progress schema v2 and publishes the exact curriculum-v4 manifest", () => {
  assert.equal(FOUNDATION_PROGRESS_SCHEMA_VERSION, 2);
  assert.equal(FOUNDATION_CURRICULUM_VERSION, 4);
  assert.equal(FOUNDATION_PROGRESS_MANIFEST.length, 23);
  assert.equal(FOUNDATION_PROGRESS_MANIFEST_VERSION_2.length, 14);
  assert.equal(FOUNDATION_PROGRESS_MANIFEST_VERSION_3.length, 15);
  assert.equal(FOUNDATION_PROGRESS_LEVEL1_LESSON_SLUGS.length, 7);
  assert.equal(
    FOUNDATION_PROGRESS_LEVEL1_LESSON_SLUGS.includes("internet-web-browser-server"),
    false,
  );
  assert.deepEqual(
    FOUNDATION_PROGRESS_MANIFEST_VERSION_2,
    FOUNDATION_PROGRESS_MANIFEST.slice(0, 14),
  );
  assert.deepEqual(
    FOUNDATION_PROGRESS_MANIFEST_VERSION_3,
    FOUNDATION_PROGRESS_MANIFEST.slice(0, 15),
  );
  assert.deepEqual(
    published.map(({ lessonSlug, lessonVersion, progressStepIds, activityIds }) => ({ lessonSlug, lessonVersion, progressStepIds, activityIds })),
    FOUNDATION_PROGRESS_MANIFEST.map(({ slug, lessonVersion, stepIds, activityIds }) => ({ lessonSlug: slug, lessonVersion, progressStepIds: stepIds, activityIds })),
  );
  assert.equal(getLessonStorageKey("what-is-code", 3), "vibe-to-code:lesson-progress:v1:what-is-code:lesson-v3");
});

test("all eight new trusted bundles have stable IDs, exactly three reachable activities, and verified primary sources", () => {
  const definitions = newLevel2Slugs.map((slug) => lessonContentRegistry.bySlug(slug));
  assert.equal(new Set(definitions.map((definition) => definition.lessonSlug)).size, 8);
  definitions.forEach((definition) => {
    assert.deepEqual(validateLessonContentDefinition(definition), []);
    assert.deepEqual(
      validatePublishableLessonBundle(getPublishedLessonBySlug(definition.lessonSlug), lessonContentRegistry),
      [],
    );
    assert.equal(definition.guidedSteps.length, 6);
    assert.equal(definition.activities.length, 3);
    assert.deepEqual(
      definition.completionRule.requiredActivityIds,
      definition.activities.map((activity) => activity.id),
    );
    assert.equal(new Set(definition.guidedSteps.map((step) => step.id)).size, 6);
    assert.equal(new Set(definition.activities.map((activity) => activity.id)).size, 3);
    const checkpoints = definition.guidedSteps.flatMap((step) => step.blocks.filter(
      (block) => block.type === "single-answer-checkpoint" ||
        block.type === "ordering-checkpoint" || block.type === "counter-simulation",
    ));
    assert.deepEqual(checkpoints.map((block) => block.activityId).sort(), definition.activities.map((activity) => activity.id).sort());
    checkpoints.forEach((checkpoint) => {
      const activity = definition.activities.find((candidate) => candidate.id === checkpoint.activityId);
      const expectedBlockType = activity.type === "counter-simulation"
        ? "counter-simulation"
        : `${activity.type}-checkpoint`;
      assert.equal(checkpoint.type, expectedBlockType);
    });
    assert.equal(definition.sourceVerifiedAt, "2026-08-17");
    definition.sources.forEach((source) => {
      const url = new URL(source.url);
      assert.equal(url.protocol, "https:");
      assert.ok(source.title.trim().length > 0);
      assert.ok(["developer.mozilla.org", "developer.chrome.com"].includes(url.hostname));
    });
  });
});

test("Lesson 15 is a valid trusted publishable bundle with the exact completion rule", () => {
  const catalogEntry = getPublishedLessonBySlug("internet-web-browser-server");
  assert.deepEqual(validateLessonContentDefinition(internetWebBrowserServerLesson), []);
  assert.deepEqual(validatePublishableLessonBundle(catalogEntry, lessonContentRegistry), []);
  assert.deepEqual(internetWebBrowserServerLesson.completionRule.requiredActivityIds, [
    "classify-web-roles",
    "order-page-journey",
    "identify-missing-layer",
  ]);
  assert.equal(internetWebBrowserServerLesson.guidedSteps.length, 6);
  assert.equal(internetWebBrowserServerLesson.sources.length, 5);
  assert.equal(internetWebBrowserServerLesson.sourceVerifiedAt, "2026-08-16");
  assert.deepEqual(internetWebBrowserServerLesson.sources, [
    { title: "Internet — MDN Glossary", url: "https://developer.mozilla.org/en-US/docs/Glossary/Internet" },
    { title: "World Wide Web — MDN Glossary", url: "https://developer.mozilla.org/en-US/docs/Glossary/World_Wide_Web" },
    { title: "Browser — MDN Glossary", url: "https://developer.mozilla.org/en-US/docs/Glossary/Browser" },
    { title: "What is a web server? — MDN Learn", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_web_server" },
    { title: "How the web works — MDN Learn", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works" },
  ]);
});

test("generic renderer dispatches only trusted blocks and preserves completion requirements", () => {
  assert.deepEqual(SUPPORTED_LESSON_BLOCK_TYPES, [
    "explanation", "callout", "example", "single-answer-checkpoint",
    "ordering-checkpoint", "counter-simulation", "recap", "transfer-challenge",
  ]);
  SUPPORTED_LESSON_BLOCK_TYPES.forEach((type) => assert.equal(getLessonBlockRendererKind({ type }), type));
  assert.throws(() => getLessonBlockRendererKind({ type: "component-name" }), /Unsupported/);
  const steps = getGuidedStepsForLessonDefinition(contentFixture());
  assert.deepEqual(steps[0].requiredActivityIds, ["fixture-check"]);
  assert.equal(steps[0].requiresPractice, true);
});

test("corrected Level 2 content keeps valid reasoning, sizing, and evidence explicit", () => {
  const lesson16 = lessonContentRegistry.bySlug("urls-domains-dns-paths-queries");
  const urlDiagram = lesson16.guidedSteps[0].blocks.find((block) => block.type === "example").code;
  assert.match(urlDiagram, /Scheme:\s+https\nHostname:\s+learn\.example\.org/);
  assert.doesNotMatch(urlDiagram, /\|--- hostname ---\|/);

  const lesson18 = lessonContentRegistry.bySlug("browser-developer-tools");
  const devtoolsCopy = JSON.stringify(lesson18.guidedSteps);
  assert.match(devtoolsCopy, /Chrome or Chromium/);
  assert.match(devtoolsCopy, /Elements, Console, and Network are Chrome panel names/);
  assert.match(devtoolsCopy, /reload the page and observe the original heading return/);
  assert.match(devtoolsCopy, /sufficient for completion/);

  const lesson19 = lessonContentRegistry.bySlug("first-html-document");
  const htmlCopy = JSON.stringify(lesson19.guidedSteps);
  assert.match(htmlCopy, /lang=\\\"en\\\"/);
  assert.match(htmlCopy, /meta charset=\\\"utf-8\\\"/);
  assert.match(htmlCopy, /HTML comment/);
  assert.ok(lesson19.sources.some((source) => source.url.endsWith("/Elements/meta")));
  assert.ok(lesson19.sources.some((source) => source.url.endsWith("/Guides/Comments")));

  const lesson20 = lessonContentRegistry.bySlug("meaningful-html-text-links-images-controls");
  const labelActivity = lesson20.activities.find((activity) => activity.id === "order-labeled-control");
  assert.equal(labelActivity.type, "single-answer");
  assert.equal(labelActivity.correctOptionId, "matching-for-id");
  assert.match(labelActivity.options.find((option) => option.id === "matching-for-id").feedback, /choosing the wording or input type first is not/);

  const lesson22 = lessonContentRegistry.bySlug("box-model-layout-responsive-design");
  const containerExample = lesson22.guidedSteps
    .flatMap((step) => step.blocks)
    .find((block) => block.type === "example" && block.title.includes("constrained"));
  assert.match(containerExample.code, /box-sizing: border-box;/);
  assert.match(containerExample.code, /width: 100%;/);
  assert.match(containerExample.code, /padding: 1rem;/);
  assert.ok(containerExample.code.indexOf("box-sizing: border-box") < containerExample.code.indexOf("width: 100%"));
  assert.match(JSON.stringify(lesson22.guidedSteps), /content-box.*padding outside/);
  assert.ok(lesson22.sources.some((source) => source.url.endsWith("/Properties/box-sizing")));
});

test("trusted counter simulation advances 0 to 1 to 2 and restores completion authoritatively", () => {
  const lesson23 = lessonContentRegistry.bySlug("javascript-dom-events");
  const activity = lesson23.activities.find((candidate) => candidate.id === "simulate-counter-clicks");
  assert.equal(activity.type, "counter-simulation");
  assert.equal(activity.initialCount, 0);
  assert.equal(activity.targetCount, 2);
  assert.equal(activity.buttonLabel, "Add one");

  let count = getCounterSimulationDisplayCount(activity, activity.initialCount, false);
  assert.equal(count, 0);
  count = advanceCounterSimulation(activity, count, false);
  assert.equal(getCounterSimulationDisplayCount(activity, count, false), 1);
  count = advanceCounterSimulation(activity, count, false);
  assert.equal(getCounterSimulationDisplayCount(activity, count, false), 2);
  assert.equal(advanceCounterSimulation(activity, count, false), 2);
  assert.equal(getCounterSimulationDisplayCount(activity, 0, true), 2);

  const example = lesson23.guidedSteps
    .flatMap((step) => step.blocks)
    .find((block) => block.type === "example" && block.title.includes("click-to-screen"));
  assert.match(example.code, /querySelector/);
  assert.match(example.code, /addEventListener/);
  assert.match(example.code, /let count = 0/);
  assert.match(example.code, /textContent/);

  const renderer = fs.readFileSync(
    path.join(process.cwd(), "src/components/generic-lesson-renderer.tsx"),
    "utf8",
  );
  assert.match(renderer, /<button[\s\S]*type="button"[\s\S]*activity\.buttonLabel/);
  assert.match(renderer, /<output aria-live="polite" aria-atomic="true">Count:/);
  assert.doesNotMatch(renderer, /\beval\s*\(|dangerouslySetInnerHTML|<iframe|setTimeout|fetch\s*\(/);
});

test("completed ordering restoration always displays the verified correct order", () => {
  const activity = internetWebBrowserServerLesson.activities.find(
    (candidate) => candidate.id === "order-page-journey",
  );
  const scrambled = activity.items.map((item) => item.id);
  assert.notDeepEqual(scrambled, activity.correctOrder);
  assert.deepEqual(
    getOrderingCheckpointDisplayOrder(activity, scrambled, false),
    scrambled,
  );
  assert.deepEqual(
    getOrderingCheckpointDisplayOrder(activity, scrambled, true),
    activity.correctOrder,
  );
});

test("checkpoint display state replaces stale local errors after external completion", () => {
  const choiceWrong = getChoiceCheckpointDisplayState({
    completed: false,
    correctId: "correct",
    selectedId: "wrong",
    feedback: "Try again.",
    answerCorrect: false,
    successMessage: "Correct.",
  });
  assert.deepEqual(choiceWrong, {
    selectedId: "wrong",
    feedback: "Try again.",
    answerCorrect: false,
  });
  assert.deepEqual(getChoiceCheckpointDisplayState({
    completed: true,
    correctId: "correct",
    selectedId: choiceWrong.selectedId,
    feedback: choiceWrong.feedback,
    answerCorrect: choiceWrong.answerCorrect,
    successMessage: "Correct.",
  }), {
    selectedId: "correct",
    feedback: "Correct.",
    answerCorrect: true,
  });
  assert.deepEqual(getChoiceCheckpointDisplayState({
    completed: true,
    correctId: "correct",
    selectedId: "",
    feedback: "",
    answerCorrect: false,
    successMessage: "Correct.",
  }), {
    selectedId: "correct",
    feedback: "Correct.",
    answerCorrect: true,
  });

  const activity = internetWebBrowserServerLesson.activities.find(
    (candidate) => candidate.id === "order-page-journey",
  );
  const scrambled = activity.items.map((item) => item.id);
  const orderingWrong = getOrderingCheckpointDisplayState(
    activity,
    scrambled,
    activity.errorMessage,
    `Incorrect sequence. ${activity.errorMessage}`,
    false,
  );
  assert.equal(orderingWrong.feedback, activity.errorMessage);
  assert.equal(orderingWrong.announcement, `Incorrect sequence. ${activity.errorMessage}`);
  assert.deepEqual(getOrderingCheckpointDisplayState(
    activity,
    orderingWrong.order,
    orderingWrong.feedback,
    orderingWrong.announcement,
    true,
  ), {
    order: [...activity.correctOrder],
    feedback: activity.successMessage,
    announcement: activity.successMessage,
  });
  assert.deepEqual(getOrderingCheckpointDisplayState(
    activity,
    scrambled,
    "",
    "",
    true,
  ), {
    order: [...activity.correctOrder],
    feedback: activity.successMessage,
    announcement: activity.successMessage,
  });
});

test("generic checkpoint focus, live-region, and touch controls are structurally enforced", () => {
  const renderer = fs.readFileSync(
    path.join(process.cwd(), "src/components/generic-lesson-renderer.tsx"),
    "utf8",
  );
  const styles = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
  assert.match(renderer, /movementControls\.current/);
  assert.match(renderer, /target\.focus\(\)/);
  assert.match(renderer, /Moved \$\{item\?\.label/);
  assert.match(renderer, /Incorrect sequence\. \$\{activity\.errorMessage\}/);
  assert.match(renderer, /aria-live="polite"/);
  assert.match(renderer, /aria-atomic="true"/);
  assert.match(renderer, /type="button"/);
  assert.doesNotMatch(renderer, /draggable|onDrag|setTimeout|setInterval|requestAnimationFrame/);
  assert.match(styles, /\.ordering-checkpoint-controls[\s\S]*flex-wrap: wrap/);
  assert.match(styles, /\.ordering-checkpoint-controls \.button[\s\S]*min-height: 44px/);
});

test("ChoiceCheckpoint neutral-indicator rendering is structurally enforced", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src/components/choice-checkpoint.tsx"),
    "utf8",
  );
  assert.match(source, /displayState\.answerCorrect \? "✓" : "•"/);
  assert.doesNotMatch(source, /selected \? "✓"/);
});

test("the data-driven renderer has no executable network, HTML, iframe, timer, or drag path", () => {
  const renderer = fs.readFileSync(
    path.join(process.cwd(), "src/components/generic-lesson-renderer.tsx"),
    "utf8",
  );
  for (const forbidden of [
    "dangerouslySetInnerHTML", "<iframe", "<script", "eval(", "new Function",
    "fetch(", "XMLHttpRequest", "WebSocket", "setTimeout", "setInterval", "draggable", "onDrag",
  ]) {
    assert.equal(renderer.includes(forbidden), false, forbidden);
  }
});
