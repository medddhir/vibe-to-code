export const FOUNDATION_PROGRESS_SCHEMA_VERSION = 2;
export const FOUNDATION_CURRICULUM_VERSION = 2;

export type FoundationProgressLessonManifest = {
  slug: string;
  lessonVersion: number;
  stepIds: readonly string[];
  activityIds: readonly string[];
};

export const FOUNDATION_PROGRESS_MANIFEST = [
  {
    slug: "what-is-code",
    lessonVersion: 3,
    stepIds: ["launch", "flow", "predict", "remix", "debug", "verify"],
    activityIds: [],
  },
  {
    slug: "source-code-running-output",
    lessonVersion: 1,
    stepIds: ["three-forms", "save-run-loop", "stale-output", "repair-workflow", "transfer-model"],
    activityIds: [],
  },
  {
    slug: "hardware-operating-systems-apps",
    lessonVersion: 1,
    stepIds: ["stack-sort", "os-job", "browser-website", "failure-layer", "stack-transfer"],
    activityIds: [],
  },
  {
    slug: "files-folders-extensions",
    lessonVersion: 1,
    stepIds: ["file-folder-model", "build-project-tree", "extension-trap", "extension-jobs", "organize-transfer"],
    activityIds: [],
  },
  {
    slug: "paths-current-folder",
    lessonVersion: 1,
    stepIds: ["path-model", "same-folder", "move-up", "case-slashes", "path-transfer"],
    activityIds: [],
  },
  {
    slug: "vscode-without-getting-lost",
    lessonVersion: 1,
    stepIds: ["panel-map", "open-edit-save", "unsaved-dot", "evidence-panels", "workbench-transfer"],
    activityIds: [],
  },
  {
    slug: "terminal-without-fear",
    lessonVersion: 1,
    stepIds: ["prompt-model", "navigation-mission", "safe-commands", "silent-success", "terminal-transfer"],
    activityIds: [],
  },
  {
    slug: "values-variables-types",
    lessonVersion: 1,
    stepIds: ["value-lab", "compare-types", "trace-memory", "fix-type-mix", "name-things", "capstone-change"],
    activityIds: [],
  },
  {
    slug: "decisions-loops-functions",
    lessonVersion: 1,
    stepIds: ["if-logic", "loop-iteration", "broken-loop", "predict-path", "function-output", "pass-retry-mission"],
    activityIds: [
      "if-logic-simulator",
      "if-logic-check",
      "loop-iteration-simulator",
      "loop-iteration-check",
      "broken-loop-simulator",
      "broken-loop-check",
    ],
  },
  {
    slug: "input-process-output-state",
    lessonVersion: 1,
    stepIds: ["input-flow", "state-journey", "broken-update", "trace-observe", "predict-repeat", "recap"],
    activityIds: [
      "state-journey-simulator",
      "state-journey-check",
      "trace-observe-simulator",
      "trace-observe-check",
      "predict-repeat-simulator",
      "predict-repeat-check",
    ],
  },
  {
    slug: "languages-syntax-errors",
    lessonVersion: 1,
    stepIds: ["language-jobs", "safe-starter", "repair-syntax", "error-language", "language-sorting", "lesson-recap"],
    activityIds: [],
  },
  {
    slug: "interpreters-compilers-runtimes",
    lessonVersion: 1,
    stepIds: ["journey-concept", "python-route", "javascript-route", "compiled-route", "broken-runtime", "mission-route", "journey-recap"],
    activityIds: [],
  },
  {
    slug: "packages-dependencies-environments",
    lessonVersion: 1,
    stepIds: ["project-snapshot", "install-react", "compare-env", "lock-mission", "security-verification", "package-mission", "lesson-recap"],
    activityIds: ["security-verification-simulator", "security-verification-check"],
  },
  {
    slug: "frontend-backend-api-database-cloud",
    lessonVersion: 1,
    stepIds: ["journey-concept", "frontend-journey-success", "backend-validation", "secret-placement", "journey-repair", "journey-mission", "lesson-recap"],
    activityIds: [
      "backend-validation-simulator",
      "backend-validation-check",
      "secret-placement-simulator",
      "secret-placement-check",
    ],
  },
] as const satisfies readonly FoundationProgressLessonManifest[];

export type FoundationProgressLessonSlug =
  (typeof FOUNDATION_PROGRESS_MANIFEST)[number]["slug"];

export const FOUNDATION_PROGRESS_LESSON_ORDER = FOUNDATION_PROGRESS_MANIFEST.map(
  (lesson) => lesson.slug,
);

export const FOUNDATION_PROGRESS_LEVEL0_LESSON_COUNT = 7;
export const FOUNDATION_PROGRESS_LEVEL1_LESSON_SLUGS =
  FOUNDATION_PROGRESS_LESSON_ORDER.slice(FOUNDATION_PROGRESS_LEVEL0_LESSON_COUNT);

export const FOUNDATION_PROGRESS_BY_SLUG = Object.fromEntries(
  FOUNDATION_PROGRESS_MANIFEST.map((lesson) => [lesson.slug, lesson]),
) as Record<FoundationProgressLessonSlug, (typeof FOUNDATION_PROGRESS_MANIFEST)[number]>;

export function getFoundationProgressLessonManifest(lessonSlug: string) {
  return FOUNDATION_PROGRESS_BY_SLUG[lessonSlug as FoundationProgressLessonSlug] ?? null;
}

export function getFoundationKnownProgressIds(lessonSlug: string) {
  const lesson = getFoundationProgressLessonManifest(lessonSlug);
  return lesson ? [...lesson.stepIds, ...lesson.activityIds] : [];
}
