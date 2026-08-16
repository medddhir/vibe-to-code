/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  FOUNDATION_LEVEL0_LESSONS,
  FOUNDATION_LEVEL1_LESSONS,
  FOUNDATION_PUBLISHED_LESSONS,
  FOUNDATION_PUBLISHED_TOTAL_LESSONS,
  getFoundationCourseMapHref,
  getFoundationLessonJourney,
} = require("../src/data/foundations-level1.ts");

test("counts only the published lessons in the active Foundation path", () => {
  assert.equal(FOUNDATION_PUBLISHED_TOTAL_LESSONS, 15);
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

test("hands Lesson 14 into Lesson 15 and ends the path at Lesson 15", () => {
  const lesson14 = FOUNDATION_LEVEL1_LESSONS.at(-1);
  const lesson15 = FOUNDATION_PUBLISHED_LESSONS.at(-1);
  const lesson14Journey = getFoundationLessonJourney(lesson14.slug);
  const lesson15Journey = getFoundationLessonJourney(lesson15.slug);

  assert.equal(lesson14Journey.next.lesson.slug, "internet-web-browser-server");
  assert.equal(lesson14Journey.startsNextLevel, true);
  assert.equal(lesson14Journey.completesPublishedPath, false);
  assert.equal(lesson15Journey.previous.lesson.slug, "frontend-backend-api-database-cloud");
  assert.equal(lesson15Journey.next, null);
  assert.equal(lesson15Journey.completesPublishedPath, true);
});
