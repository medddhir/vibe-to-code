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
  assert.equal(FOUNDATION_PUBLISHED_TOTAL_LESSONS, 23);
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

test("runs sequentially from Lesson 14 through the complete Level 2 path and ends at Lesson 23", () => {
  const lesson14 = FOUNDATION_LEVEL1_LESSONS.at(-1);
  const level2Slugs = [
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
  const lesson14Journey = getFoundationLessonJourney(lesson14.slug);

  assert.equal(lesson14Journey.next.lesson.slug, level2Slugs[0]);
  assert.equal(lesson14Journey.startsNextLevel, true);
  assert.equal(lesson14Journey.completesPublishedPath, false);
  level2Slugs.forEach((slug, index) => {
    const journey = getFoundationLessonJourney(slug);
    assert.equal(
      journey.previous.lesson.slug,
      index === 0 ? "frontend-backend-api-database-cloud" : level2Slugs[index - 1],
    );
    assert.equal(journey.next?.lesson.slug ?? null, level2Slugs[index + 1] ?? null);
    assert.equal(journey.completesPublishedPath, index === level2Slugs.length - 1);
  });
  assert.deepEqual(
    FOUNDATION_PUBLISHED_LESSONS.slice(-9).map((lesson) => lesson.slug),
    level2Slugs,
  );
});
