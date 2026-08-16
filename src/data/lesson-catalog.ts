import { courses } from "@/data/curriculum";
import {
  LESSON_CATALOG_SCHEMA_VERSION,
  type LessonCatalogEntry,
} from "@/data/lesson-schema";
import {
  FOUNDATION_PROGRESS_MANIFEST,
} from "@/lib/progress-manifest";

const publishedManifestBySlug = new Map(
  FOUNDATION_PROGRESS_MANIFEST.map((lesson) => [lesson.slug, lesson]),
);

const publishedOrder = FOUNDATION_PROGRESS_MANIFEST.map((lesson) => lesson.slug);

function createPlannedSlug(courseSlug: string, title: string, position: string) {
  const titleSlug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${courseSlug}-${titleSlug || position}`;
}

function parseMinutes(duration: string) {
  const minutes = Number.parseInt(duration, 10);
  return Number.isFinite(minutes) ? minutes : 1;
}

const outlinedEntries = courses.flatMap((course) =>
  course.levels.flatMap((level, levelIndex) =>
    level.lessons.map((lesson, lessonIndex) => {
      const manifest = course.slug === "foundations" && lesson.slug
        ? publishedManifestBySlug.get(lesson.slug as (typeof FOUNDATION_PROGRESS_MANIFEST)[number]["slug"])
        : undefined;
      const isPublished = Boolean(manifest);
      const lessonSlug = lesson.slug ?? createPlannedSlug(
        course.slug,
        lesson.title,
        `${levelIndex + 1}-${lessonIndex + 1}`,
      );

      return {
        schemaVersion: LESSON_CATALOG_SCHEMA_VERSION,
        courseSlug: course.slug,
        levelIndex,
        lessonIndex,
        lessonSlug,
        lessonVersion: manifest?.lessonVersion ?? 1,
        route: isPublished ? `/lessons/${lessonSlug}` : null,
        title: lesson.title,
        estimatedMinutes:
          lessonSlug === "what-is-code" ? 10 : parseMinutes(lesson.duration),
        publicationState: isPublished ? "published" : "planned",
        renderMode: isPublished ? "legacy-bespoke" : "data-driven",
        access: isPublished
          ? lessonSlug === "what-is-code" ? "public" : "authenticated"
          : "unavailable",
        previousLessonSlug: null,
        nextLessonSlug: null,
        progressStepIds: manifest?.stepIds ?? [],
        activityIds: manifest?.activityIds ?? [],
      } satisfies LessonCatalogEntry;
    }),
  ),
);

function withNavigation(entries: readonly LessonCatalogEntry[]) {
  const orderedPublished = publishedOrder.map((slug) => {
    const entry = entries.find((candidate) => candidate.lessonSlug === slug);
    if (!entry) throw new Error(`Published lesson ${slug} is missing from the catalog`);
    return entry;
  });

  const publishedNavigation = new Map(
    orderedPublished.map((entry, index) => [
      entry.lessonSlug,
      {
        previousLessonSlug: orderedPublished[index - 1]?.lessonSlug ?? null,
        nextLessonSlug: orderedPublished[index + 1]?.lessonSlug ?? null,
      },
    ]),
  );

  return entries.map((entry) => ({
    ...entry,
    ...(publishedNavigation.get(entry.lessonSlug) ?? {}),
  }));
}

/**
 * The catalog includes every lesson with an existing curriculum outline.
 * Courses that currently declare only aggregate counts remain represented by
 * the curriculum, not by invented lesson metadata.
 */
export const LESSON_CATALOG = Object.freeze(withNavigation(outlinedEntries));
