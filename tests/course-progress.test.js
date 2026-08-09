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
  getLessonProgressState,
  resetLessonProgress,
  resetCourseProgress,
  getLessonOrder,
  getLessonUnlockState,
  getCourseStorageKey,
  foundationLevel0Order,
  foundationLevel1Order,
} = require("../src/lib/course-progress.ts");

test("creates a versioned foundation progress record", () => {
  const snapshot = getCourseProgressSnapshot("foundations");
  const expected = getLessonOrder("foundations");
  assert.equal(snapshot.version, 1);
  assert.equal(snapshot.courseVersion, 2);
  assert.equal(snapshot.lessonOrder.length, 14);
  assert.equal(snapshot.legacyLevel1Access, false);
  assert.deepEqual(snapshot.lessonOrder, expected);
  assert.deepEqual(snapshot.lessonOrder, [...foundationLevel0Order, ...foundationLevel1Order]);
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
  assert.equal(migrated.courseVersion, 2);
  assert.equal(migrated.lessonOrder.length, 14);
  assert.equal(migrated.legacyLevel1Access, true);
  assert.equal(migrated.lessons[legacyLesson].completed, true);
  assert.equal(migrated.lessons[legacyLesson].totalAttempts, 2);
  assert.equal(isLessonUnlocked("foundations", legacyLesson), true);

  resetCourseProgress("foundations");
});
