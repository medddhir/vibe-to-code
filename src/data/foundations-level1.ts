import { foundationLevels } from "@/data/course-content";
import type { Lesson } from "@/data/curriculum";

export const FOUNDATION_LEVEL0_LESSONS = foundationLevels[0]?.lessons ?? [];
export const FOUNDATION_LEVEL1_LESSONS = foundationLevels[1]?.lessons ?? [];

export const FOUNDATION_LEVEL0_TOTAL_LESSONS = FOUNDATION_LEVEL0_LESSONS.length;
export const FOUNDATION_LEVEL1_TOTAL_LESSONS = FOUNDATION_LEVEL1_LESSONS.length;
export const FOUNDATION_LEVEL1_OFFSET = FOUNDATION_LEVEL0_TOTAL_LESSONS;

export const FOUNDATION_TOTAL_LESSONS = foundationLevels.reduce(
  (sum, level) => sum + level.lessons.length,
  0,
);

export const FOUNDATION_PUBLISHED_LEVELS = foundationLevels.slice(0, 2);
export const FOUNDATION_PUBLISHED_LESSONS = FOUNDATION_PUBLISHED_LEVELS.flatMap(
  (level) => level.lessons,
);
export const FOUNDATION_PUBLISHED_TOTAL_LESSONS = FOUNDATION_PUBLISHED_LESSONS.length;

type FoundationLessonSlot = {
  index: number;
  number: number;
  courseNumber: number;
  levelIndex: number;
  levelLabel: string;
  levelTitle: string;
  levelTotal: number;
  lesson: Lesson;
};

function createLevelMap(
  lessons: Lesson[],
  levelIndex: number,
  courseOffset: number,
) {
  const level = foundationLevels[levelIndex];

  return lessons.reduce<Record<string, FoundationLessonSlot>>((acc, lesson, index) => {
    const lessonSlug = lesson.slug;

    if (!lessonSlug) {
      return acc;
    }

    acc[lessonSlug] = {
      index,
      number: index + 1,
      courseNumber: courseOffset + index + 1,
      levelIndex,
      levelLabel: level?.label ?? `Level ${levelIndex}`,
      levelTitle: level?.title ?? "Developer Foundations",
      levelTotal: lessons.length,
      lesson,
    };

    return acc;
  }, {});
}

export const FOUNDATION_LEVEL0_BY_SLUG = createLevelMap(
  FOUNDATION_LEVEL0_LESSONS,
  0,
  0,
);

export const FOUNDATION_LEVEL1_BY_SLUG = createLevelMap(
  FOUNDATION_LEVEL1_LESSONS,
  1,
  FOUNDATION_LEVEL1_OFFSET,
);

export const FOUNDATION_PUBLISHED_BY_SLUG = {
  ...FOUNDATION_LEVEL0_BY_SLUG,
  ...FOUNDATION_LEVEL1_BY_SLUG,
};

export function getFoundationLessonSlot(lessonSlug: string) {
  return FOUNDATION_PUBLISHED_BY_SLUG[lessonSlug];
}

export function getFoundationsLessonNumber(lessonSlug: string) {
  return getFoundationLessonSlot(lessonSlug)?.number;
}

export function getFoundationsCourseLessonNumber(lessonSlug: string) {
  return getFoundationLessonSlot(lessonSlug)?.courseNumber;
}
