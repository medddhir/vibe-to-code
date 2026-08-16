import type { LessonAccess, LessonRenderMode } from "@/data/lesson-schema";

export type LessonPublicationRecord = {
  courseSlug: string;
  levelIndex: number;
  lessonIndex: number;
  lessonSlug: string;
  route: string;
  renderMode: LessonRenderMode;
  access: Exclude<LessonAccess, "unavailable">;
};

export const PUBLIC_LESSON_IDENTITY = Object.freeze({
  courseSlug: "foundations",
  lessonSlug: "what-is-code",
  route: "/lessons/what-is-code",
});

/** Explicit publication authority. Progress metadata alone never publishes a lesson. */
export const LESSON_PUBLICATION_RECORD = Object.freeze([
  [0, 0, "what-is-code", "public"],
  [0, 1, "source-code-running-output", "authenticated"],
  [0, 2, "hardware-operating-systems-apps", "authenticated"],
  [0, 3, "files-folders-extensions", "authenticated"],
  [0, 4, "paths-current-folder", "authenticated"],
  [0, 5, "vscode-without-getting-lost", "authenticated"],
  [0, 6, "terminal-without-fear", "authenticated"],
  [1, 0, "values-variables-types", "authenticated"],
  [1, 1, "decisions-loops-functions", "authenticated"],
  [1, 2, "input-process-output-state", "authenticated"],
  [1, 3, "languages-syntax-errors", "authenticated"],
  [1, 4, "interpreters-compilers-runtimes", "authenticated"],
  [1, 5, "packages-dependencies-environments", "authenticated"],
  [1, 6, "frontend-backend-api-database-cloud", "authenticated"],
].map(([levelIndex, lessonIndex, lessonSlug, access]) => Object.freeze({
  courseSlug: "foundations",
  levelIndex: levelIndex as number,
  lessonIndex: lessonIndex as number,
  lessonSlug: lessonSlug as string,
  route: `/lessons/${lessonSlug}`,
  renderMode: "legacy-bespoke" as const,
  access: access as "public" | "authenticated",
}))) satisfies readonly LessonPublicationRecord[];
