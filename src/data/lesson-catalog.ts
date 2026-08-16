import { courses, type Course } from "@/data/curriculum";
import { LESSON_PUBLICATION_RECORD, type LessonPublicationRecord } from "@/data/lesson-publication";
import { LESSON_CATALOG_SCHEMA_VERSION, type LessonCatalogEntry } from "@/data/lesson-schema";
import { FOUNDATION_PROGRESS_MANIFEST, type FoundationProgressLessonManifest } from "@/lib/progress-manifest";

const DURATION_PATTERN = /^([1-9]\d*) min$/;

export function parseLessonDuration(duration: unknown) {
  if (typeof duration !== "string") throw new Error("Lesson duration must be a string");
  const match = DURATION_PATTERN.exec(duration);
  if (!match) throw new Error(`Invalid lesson duration: ${JSON.stringify(duration)}`);
  const minutes = Number(match[1]);
  if (!Number.isSafeInteger(minutes)) throw new Error(`Invalid lesson duration: ${JSON.stringify(duration)}`);
  return minutes;
}

function catalogId(courseSlug: string, levelIndex: number, lessonIndex: number) {
  return `${courseSlug}:level:${levelIndex}:lesson:${lessonIndex}`;
}

function provisionalSlug(courseSlug: string, levelIndex: number, lessonIndex: number) {
  return `planned-${courseSlug}-level-${levelIndex}-lesson-${lessonIndex}`;
}

export function createLessonCatalog(
  courseDefinitions: readonly Course[],
  publicationRecords: readonly LessonPublicationRecord[],
  progressManifest: readonly FoundationProgressLessonManifest[],
) {
  const publicationByPosition = new Map(
    publicationRecords.map((record) => [
      catalogId(record.courseSlug, record.levelIndex, record.lessonIndex),
      record,
    ]),
  );
  const manifestBySlug = new Map(progressManifest.map((lesson) => [lesson.slug, lesson]));

  const entries = courseDefinitions.flatMap((course) =>
    course.levels.flatMap((level, levelIndex) =>
      level.lessons.map((lesson, lessonIndex) => {
        const id = catalogId(course.slug, levelIndex, lessonIndex);
        const publication = publicationByPosition.get(id);
        if (publication && lesson.slug !== publication.lessonSlug) {
          throw new Error(`Publication record does not match curriculum position ${id}`);
        }
        const manifest = publication ? manifestBySlug.get(publication.lessonSlug) : undefined;
        if (publication && !manifest) {
          throw new Error(`Published lesson ${publication.lessonSlug} is missing progress compatibility metadata`);
        }
        const isPublished = Boolean(publication);
        const lessonSlug = publication?.lessonSlug ?? provisionalSlug(course.slug, levelIndex, lessonIndex);

        return {
          schemaVersion: LESSON_CATALOG_SCHEMA_VERSION,
          catalogId: id,
          courseSlug: course.slug,
          levelIndex,
          lessonIndex,
          lessonSlug,
          slugState: isPublished ? "permanent" : "provisional",
          lessonVersion: manifest?.lessonVersion ?? 1,
          route: publication?.route ?? null,
          title: lesson.title,
          estimatedMinutes: parseLessonDuration(lesson.duration),
          publicationState: isPublished ? "published" : "planned",
          renderMode: publication?.renderMode ?? "data-driven",
          access: publication?.access ?? "unavailable",
          previousLessonSlug: null,
          nextLessonSlug: null,
          progressStepIds: Object.freeze([...(manifest?.stepIds ?? [])]),
          activityIds: Object.freeze([...(manifest?.activityIds ?? [])]),
        } satisfies LessonCatalogEntry;
      }),
    ),
  );

  const published = publicationRecords.map((record) => {
    const entry = entries.find((candidate) => candidate.catalogId === catalogId(
      record.courseSlug,
      record.levelIndex,
      record.lessonIndex,
    ));
    if (!entry) throw new Error(`Published lesson ${record.lessonSlug} is missing from the catalog`);
    return entry;
  });
  const navigation = new Map(published.map((entry, index) => [entry.lessonSlug, {
    previousLessonSlug: published[index - 1]?.lessonSlug ?? null,
    nextLessonSlug: published[index + 1]?.lessonSlug ?? null,
  }]));

  return Object.freeze(entries.map((entry) => Object.freeze({
    ...entry,
    ...(navigation.get(entry.lessonSlug) ?? {}),
  })));
}

/** Includes outlined lessons only; aggregate-only course counts remain in curriculum data. */
export const LESSON_CATALOG = createLessonCatalog(
  courses,
  LESSON_PUBLICATION_RECORD,
  FOUNDATION_PROGRESS_MANIFEST,
);
