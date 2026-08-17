export const FOUNDATION_PROGRESS_SCHEMA_VERSION = 2;
export const FOUNDATION_CURRICULUM_VERSION = 4;
export const FOUNDATION_PREVIOUS_CURRICULUM_VERSION = 3;
export const FOUNDATION_LEGACY_CURRICULUM_VERSION = 2;

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
  {
    slug: "internet-web-browser-server",
    lessonVersion: 1,
    stepIds: [
      "separate-internet-and-web",
      "name-browser-search-and-server",
      "trace-page-journey",
      "rebuild-page-journey",
      "diagnose-connection-layer",
      "explain-complete-model",
    ],
    activityIds: [
      "classify-web-roles",
      "order-page-journey",
      "identify-missing-layer",
    ],
  },
  {
    slug: "urls-domains-dns-paths-queries",
    lessonVersion: 1,
    stepIds: [
      "read-complete-url",
      "separate-host-and-dns",
      "follow-path",
      "decode-query-fragment",
      "label-url-parts",
      "recap-url-model",
    ],
    activityIds: ["order-name-resolution", "identify-url-parts", "choose-url-change"],
  },
  {
    slug: "requests-responses-http-https",
    lessonVersion: 1,
    stepIds: [
      "name-client-server-message",
      "distinguish-get-post",
      "read-status-families",
      "compare-http-https",
      "diagnose-response-evidence",
      "recap-http-journey",
    ],
    activityIds: ["order-request-response", "classify-request-method", "interpret-status-family"],
  },
  {
    slug: "browser-developer-tools",
    lessonVersion: 1,
    stepIds: [
      "open-devtools-safely",
      "inspect-elements",
      "read-console-evidence",
      "inspect-network-evidence",
      "choose-debugging-panel",
      "recap-evidence-workflow",
    ],
    activityIds: ["interpret-devtools-change", "match-panel-evidence", "order-debugging-evidence"],
  },
  {
    slug: "first-html-document",
    lessonVersion: 1,
    stepIds: [
      "start-doctype-root",
      "separate-head-body",
      "set-document-title",
      "add-heading-paragraph",
      "assemble-html-document",
      "recap-valid-document",
    ],
    activityIds: ["identify-head-body", "order-html-structure", "diagnose-html-document"],
  },
  {
    slug: "meaningful-html-text-links-images-controls",
    lessonVersion: 1,
    stepIds: [
      "choose-semantic-text",
      "make-real-link",
      "describe-image",
      "choose-button-or-link",
      "label-form-control",
      "recap-semantic-page",
    ],
    activityIds: ["choose-semantic-element", "match-control-purpose", "order-labeled-control"],
  },
  {
    slug: "css-selectors-colour-spacing-cascade",
    lessonVersion: 1,
    stepIds: [
      "read-css-rule",
      "target-with-selectors",
      "set-colour-spacing",
      "reuse-class-rules",
      "resolve-cascade",
      "recap-predictable-styles",
    ],
    activityIds: ["identify-rule-parts", "choose-selector", "resolve-style-conflict"],
  },
  {
    slug: "box-model-layout-responsive-design",
    lessonVersion: 1,
    stepIds: [
      "see-four-box-layers",
      "keep-normal-flow",
      "choose-flex-or-grid",
      "constrain-width",
      "add-responsive-breakpoint",
      "recap-adaptive-layout",
    ],
    activityIds: ["order-box-layers", "choose-layout-tool", "predict-responsive-change"],
  },
  {
    slug: "javascript-dom-events",
    lessonVersion: 1,
    stepIds: [
      "meet-dom",
      "select-element",
      "listen-for-click",
      "update-state",
      "render-visible-result",
      "recap-click-to-screen",
    ],
    activityIds: ["choose-dom-operation", "simulate-counter-clicks", "order-dom-interaction"],
  },
] as const satisfies readonly FoundationProgressLessonManifest[];

export type FoundationProgressLessonSlug =
  (typeof FOUNDATION_PROGRESS_MANIFEST)[number]["slug"];

export const FOUNDATION_PROGRESS_LESSON_ORDER = FOUNDATION_PROGRESS_MANIFEST.map(
  (lesson) => lesson.slug,
);

export const FOUNDATION_PROGRESS_LEVEL0_LESSON_COUNT = 7;
export const FOUNDATION_PROGRESS_LEVEL1_LESSON_COUNT = 7;
export const FOUNDATION_PROGRESS_LEVEL1_LESSON_SLUGS =
  FOUNDATION_PROGRESS_LESSON_ORDER.slice(
    FOUNDATION_PROGRESS_LEVEL0_LESSON_COUNT,
    FOUNDATION_PROGRESS_LEVEL0_LESSON_COUNT + FOUNDATION_PROGRESS_LEVEL1_LESSON_COUNT,
  );

export const FOUNDATION_PROGRESS_MANIFEST_VERSION_2 =
  FOUNDATION_PROGRESS_MANIFEST.slice(0, 14) satisfies readonly FoundationProgressLessonManifest[];

export const FOUNDATION_PROGRESS_MANIFEST_VERSION_3 =
  FOUNDATION_PROGRESS_MANIFEST.slice(0, 15) satisfies readonly FoundationProgressLessonManifest[];

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
