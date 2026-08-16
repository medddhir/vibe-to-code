/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  getCourseProgressSnapshot,
  markLessonCompleted,
  isLessonUnlocked,
  recordLessonAttempt,
  recordLessonHint,
  readCourseProgress,
  getLessonProgressState,
  resetLessonProgress,
  resetCourseProgress,
  getLessonOrder,
  getLessonUnlockState,
  getCourseStorageKey,
  foundationLevel0Order,
  foundationLevel1Order,
  foundationPublishedOrder,
} = require("../src/lib/course-progress.ts");
const {
  getFoundationServerLessonSnapshot,
} = require("../src/components/foundations/lesson-state.ts");
const {
  FOUNDATION_CURRICULUM_VERSION,
} = require("../src/lib/progress-manifest.ts");

test("default Foundation server snapshot uses the current complete published path", () => {
  const snapshot = getFoundationServerLessonSnapshot();

  assert.equal(snapshot.courseVersion, FOUNDATION_CURRICULUM_VERSION);
  assert.equal(snapshot.courseVersion, 3);
  assert.equal(snapshot.lessonOrder.length, 15);
  assert.deepEqual(snapshot.lessonOrder, foundationPublishedOrder);
  assert.deepEqual(Object.keys(snapshot.lessons), foundationPublishedOrder);
});

test("creates a versioned foundation progress record", () => {
  const snapshot = getCourseProgressSnapshot("foundations");
  const expected = getLessonOrder("foundations");
  assert.equal(snapshot.version, 1);
  assert.equal(snapshot.courseVersion, 3);
  assert.equal(snapshot.lessonOrder.length, 15);
  assert.equal(snapshot.legacyLevel1Access, false);
  assert.deepEqual(snapshot.lessonOrder, expected);
  assert.deepEqual(snapshot.lessonOrder, foundationPublishedOrder);
});

test("supports attempts, hints, and completion checkpoints", () => {
  resetCourseProgress("foundations");
  recordLessonAttempt("foundations", "values-variables-types", "step-setup");
  recordLessonAttempt("foundations", "values-variables-types", "step-setup");
  recordLessonHint("foundations", "values-variables-types", "step-setup");

  const lesson = getLessonProgressState("foundations", "values-variables-types");
  assert.equal(lesson.totalAttempts, 2);
  assert.equal(lesson.totalHints, 1);
  assert.equal(lesson.currentCheckpoint, "step-setup");
});

test("unlocks lessons sequentially and resets safely", () => {
  const order = getLessonOrder("foundations");
  resetCourseProgress("foundations");

  assert.equal(isLessonUnlocked("foundations", order[0]), true);
  assert.equal(isLessonUnlocked("foundations", order[1]), false);

  markLessonCompleted("foundations", order[0], "finish");
  assert.equal(isLessonUnlocked("foundations", order[1]), true);
  assert.equal(getLessonUnlockState("foundations", order[1]), "unlocked");

  resetLessonProgress("foundations", order[0]);
  const postReset = getCourseProgressSnapshot("foundations");
  assert.equal(postReset.completedLessons.length, 0);
  assert.equal(postReset.coursePercent, 0);
});

test("stores anonymous local progress state and preserves lesson lock ordering", () => {
  const snapshot = getCourseProgressSnapshot("foundations");
  const storageKey = getCourseStorageKey("foundations");
  assert.equal(typeof storageKey, "string");
  assert.equal(storageKey.startsWith("vibe-to-code:course-progress:v1:foundations"), true);
  assert.equal(getLessonUnlockState("foundations", snapshot.lessonOrder[0]), "unlocked");
});

test("migrates the former Level 1-only record without losing progress or access", () => {
  const storageKey = getCourseStorageKey("foundations");
  const legacyLesson = foundationLevel1Order[0];
  const completedAt = "2026-08-09T10:00:00.000Z";

  localStorage.setItem(storageKey, JSON.stringify({
    version: 1,
    courseVersion: 1,
    lastVisitedLesson: legacyLesson,
    lessonOrder: foundationLevel1Order,
    lessons: {
      [legacyLesson]: {
        completedAt,
        currentCheckpoint: "capstone-change",
        completedCheckpointIds: ["value-lab"],
        stepAttempts: { "value-lab": 2 },
        stepHints: { "value-lab": 1 },
      },
    },
    updatedAt: completedAt,
  }));

  const migrated = getCourseProgressSnapshot("foundations");
  assert.equal(migrated.courseVersion, 3);
  assert.equal(migrated.lessonOrder.length, 15);
  assert.equal(migrated.legacyLevel1Access, true);
  assert.equal(migrated.lessons[legacyLesson].completed, true);
  assert.equal(migrated.lessons[legacyLesson].totalAttempts, 2);
  assert.equal(isLessonUnlocked("foundations", legacyLesson), true);

  resetCourseProgress("foundations");
});

test("migrates version-2 local progress losslessly and adds only an empty Lesson 15 record", () => {
  const storageKey = getCourseStorageKey("foundations");
  const lesson14 = foundationLevel1Order.at(-1);
  const saved = {
    completedAt: "2026-08-15T09:00:00.000Z",
    currentCheckpoint: "lesson-recap",
    completedCheckpointIds: ["journey-mission"],
    stepAttempts: { "journey-mission": 4 },
    stepHints: { "journey-mission": 2 },
  };
  localStorage.setItem(storageKey, JSON.stringify({
    version: 1,
    courseVersion: 2,
    legacyLevel1Access: true,
    lastVisitedLesson: lesson14,
    lessonOrder: [...foundationLevel0Order, ...foundationLevel1Order],
    lessons: { [lesson14]: saved },
    updatedAt: "2026-08-15T09:01:00.000Z",
  }));

  const migrated = getCourseProgressSnapshot("foundations");
  const migratedRecord = readCourseProgress("foundations");
  assert.equal(migrated.courseVersion, 3);
  assert.equal(migrated.legacyLevel1Access, true);
  assert.equal(migrated.lastVisitedLesson, lesson14);
  assert.equal(migrated.lessons[lesson14].completed, true);
  assert.equal(migrated.lessons[lesson14].currentCheckpoint, "lesson-recap");
  assert.equal(migrated.lessons[lesson14].completedCheckpointCount, 1);
  assert.equal(migrated.lessons[lesson14].totalAttempts, 4);
  assert.equal(migrated.lessons[lesson14].totalHints, 2);
  assert.deepEqual(migratedRecord.lessons[lesson14], saved);
  assert.equal(migratedRecord.updatedAt, "2026-08-15T09:01:00.000Z");
  assert.deepEqual(migrated.lessons["internet-web-browser-server"], {
    completed: false,
    currentCheckpoint: null,
    completedCheckpointCount: 0,
    totalAttempts: 0,
    totalHints: 0,
  });

  resetCourseProgress("foundations");
});
