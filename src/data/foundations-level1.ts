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

export type FoundationLessonJourney = {
  current: FoundationLessonSlot;
  previous: FoundationLessonSlot | null;
  next: FoundationLessonSlot | null;
  startsNextLevel: boolean;
  completesPublishedPath: boolean;
};

export function getFoundationLessonJourney(
  lessonSlug: string,
): FoundationLessonJourney | null {
  const current = getFoundationLessonSlot(lessonSlug);

  if (!current) {
    return null;
  }

  const previousLesson = FOUNDATION_PUBLISHED_LESSONS[current.courseNumber - 2];
  const nextLesson = FOUNDATION_PUBLISHED_LESSONS[current.courseNumber];
  const previous = previousLesson?.slug
    ? getFoundationLessonSlot(previousLesson.slug) ?? null
    : null;
  const next = nextLesson?.slug
    ? getFoundationLessonSlot(nextLesson.slug) ?? null
    : null;

  return {
    current,
    previous,
    next,
    startsNextLevel: Boolean(next && next.levelIndex !== current.levelIndex),
    completesPublishedPath: !next,
  };
}

export function getFoundationCourseMapHref(lessonSlug: string) {
  const journey = getFoundationLessonJourney(lessonSlug);
  const mapLevelIndex = journey?.startsNextLevel && journey.next
    ? journey.next.levelIndex
    : journey?.current.levelIndex ?? 0;

  return `/courses/foundations#level-${mapLevelIndex + 1}`;
}
