import { LESSON_CATALOG } from "@/data/lesson-catalog";
import type { LessonCatalogEntry, LessonPublicationState } from "@/data/lesson-schema";

export function createLessonRegistry(entries: readonly LessonCatalogEntry[]) {
  const all = Object.freeze([...entries]);
  const byState = (state: LessonPublicationState) =>
    Object.freeze(all.filter((entry) => entry.publicationState === state));
  const published = byState("published");

  return Object.freeze({
    all: () => all,
    published: () => published,
    draft: () => byState("draft"),
    planned: () => byState("planned"),
    byCourse: (courseSlug: string) =>
      Object.freeze(all.filter((entry) => entry.courseSlug === courseSlug)),
    byLevel: (courseSlug: string, levelIndex: number) =>
      Object.freeze(all.filter(
        (entry) => entry.courseSlug === courseSlug && entry.levelIndex === levelIndex,
      )),
    publishedBySlug: (lessonSlug: string) =>
      published.find((entry) => entry.lessonSlug === lessonSlug) ?? null,
  });
}

export const lessonRegistry = createLessonRegistry(LESSON_CATALOG);

export const getAllLessonCatalogEntries = lessonRegistry.all;
export const getPublishedLessonCatalogEntries = lessonRegistry.published;
export const getDraftLessonCatalogEntries = lessonRegistry.draft;
export const getPlannedLessonCatalogEntries = lessonRegistry.planned;
export const getLessonCatalogEntriesByCourse = lessonRegistry.byCourse;
export const getLessonCatalogEntriesByLevel = lessonRegistry.byLevel;
export const getPublishedLessonBySlug = lessonRegistry.publishedBySlug;
