import { LESSON_CATALOG } from "@/data/lesson-catalog";
import type { LessonCatalogEntry, LessonPublicationState } from "@/data/lesson-schema";

function immutableEntry(entry: LessonCatalogEntry): Readonly<LessonCatalogEntry> {
  return Object.freeze({
    ...entry,
    progressStepIds: Object.freeze([...entry.progressStepIds]),
    activityIds: Object.freeze([...entry.activityIds]),
  });
}

export function createLessonRegistry(entries: readonly LessonCatalogEntry[]) {
  const all = Object.freeze(entries.map(immutableEntry));
  const snapshots = new Map<LessonPublicationState, readonly Readonly<LessonCatalogEntry>[]>(
    (["planned", "draft", "published"] as const).map((state) => [
      state,
      Object.freeze(all.filter((entry) => entry.publicationState === state)),
    ]),
  );
  const byState = (state: LessonPublicationState) => snapshots.get(state) ?? Object.freeze([]);
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
