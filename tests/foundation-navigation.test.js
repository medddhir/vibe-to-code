/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  FOUNDATION_LEVEL0_LESSONS,
  FOUNDATION_LEVEL1_LESSONS,
  FOUNDATION_PUBLISHED_TOTAL_LESSONS,
  getFoundationCourseMapHref,
  getFoundationLessonJourney,
} = require("../src/data/foundations-level1.ts");

test("counts only the published lessons in the active Foundation path", () => {
  assert.equal(FOUNDATION_PUBLISHED_TOTAL_LESSONS, 14);
});

test("returns the next lesson inside the same Foundation level", () => {
  const firstLesson = FOUNDATION_LEVEL0_LESSONS[0];
  const secondLesson = FOUNDATION_LEVEL0_LESSONS[1];
  const journey = getFoundationLessonJourney(firstLesson.slug);

  assert.equal(journey.next.lesson.slug, secondLesson.slug);
  assert.equal(journey.startsNextLevel, false);
  assert.equal(journey.completesPublishedPath, false);
});

test("hands the final Level 0 lesson directly into Level 1", () => {
  const finalLevel0Lesson = FOUNDATION_LEVEL0_LESSONS.at(-1);
  const firstLevel1Lesson = FOUNDATION_LEVEL1_LESSONS[0];
  const journey = getFoundationLessonJourney(finalLevel0Lesson.slug);

  assert.equal(journey.next.lesson.slug, firstLevel1Lesson.slug);
  assert.equal(journey.startsNextLevel, true);
  assert.equal(journey.next.levelLabel, "Level 1");
  assert.equal(getFoundationCourseMapHref(finalLevel0Lesson.slug), "/courses/foundations#level-2");
});

test("marks the final published lesson as the end of the path", () => {
  const finalLesson = FOUNDATION_LEVEL1_LESSONS.at(-1);
  const journey = getFoundationLessonJourney(finalLesson.slug);

  assert.equal(journey.next, null);
  assert.equal(journey.completesPublishedPath, true);
});
