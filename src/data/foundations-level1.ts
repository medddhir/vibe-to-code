import { foundationLevels } from "@/data/course-content";
import type { Lesson } from "@/data/curriculum";

export const FOUNDATION_LEVEL1_LESSONS = foundationLevels[1]?.lessons ?? [];

export const FOUNDATION_LEVEL1_OFFSET = foundationLevels[0]?.lessons?.length ?? 0;

export const FOUNDATION_TOTAL_LESSONS = foundationLevels.reduce(
  (sum, level) => sum + level.lessons.length,
  0,
);

export const FOUNDATION_LEVEL1_TOTAL_LESSONS = FOUNDATION_LEVEL1_LESSONS.length;

export const FOUNDATION_LEVEL1_BY_SLUG = FOUNDATION_LEVEL1_LESSONS.reduce(
  (acc, lesson, index) => {
    const lessonSlug = lesson.slug;

    if (!lessonSlug) {
      return acc;
    }

    acc[lessonSlug] = {
      index,
      number: index + 1,
      courseNumber: FOUNDATION_LEVEL1_OFFSET + index + 1,
      lesson,
    };

    return acc;
  },
  {} as Record<
    string,
    {
      index: number;
      number: number;
      courseNumber: number;
      lesson: Lesson;
    }
  >,
);

export function getFoundationsLessonNumber(lessonSlug: string) {
  return FOUNDATION_LEVEL1_BY_SLUG[lessonSlug]?.number;
}

export function getFoundationsCourseLessonNumber(lessonSlug: string) {
  return FOUNDATION_LEVEL1_BY_SLUG[lessonSlug]?.courseNumber;
}
