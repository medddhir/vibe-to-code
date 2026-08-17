export const LESSON_CATALOG_SCHEMA_VERSION = 1 as const;
export const LESSON_CONTENT_SCHEMA_VERSION = 1 as const;

export const LESSON_PUBLICATION_STATES = ["planned", "draft", "published"] as const;
export type LessonPublicationState = (typeof LESSON_PUBLICATION_STATES)[number];

export type LessonRenderMode = "legacy-bespoke" | "data-driven";
export type LessonAccess = "public" | "authenticated" | "unavailable";
export type LessonSlugState = "provisional" | "permanent";

export type LessonCatalogEntry = {
  schemaVersion: typeof LESSON_CATALOG_SCHEMA_VERSION;
  catalogId: string;
  courseSlug: string;
  levelIndex: number;
  lessonIndex: number;
  lessonSlug: string;
  slugState: LessonSlugState;
  lessonVersion: number;
  route: string | null;
  title: string;
  estimatedMinutes: number;
  publicationState: LessonPublicationState;
  renderMode: LessonRenderMode;
  access: LessonAccess;
  previousLessonSlug: string | null;
  nextLessonSlug: string | null;
  progressStepIds: readonly string[];
  activityIds: readonly string[];
};

export type LessonSource = {
  title: string;
  url: string;
};

export type ExplanationBlock = {
  type: "explanation";
  heading: string;
  body: readonly string[];
};

export type CalloutBlock = {
  type: "callout";
  tone: "note" | "success" | "warning";
  heading: string;
  body: string;
};

export type ExampleBlock = {
  type: "example";
  title: string;
  code: string;
  output?: string;
};

export type ActivityReferenceBlock = {
  type: "single-answer-checkpoint" | "ordering-checkpoint" | "counter-simulation";
  activityId: string;
};

export type RecapBlock = {
  type: "recap";
  heading: string;
  points: readonly string[];
};

export type TransferChallengeBlock = {
  type: "transfer-challenge";
  heading: string;
  prompt: string;
  successCriteria: readonly string[];
};

export type TrustedLessonBlock =
  | ExplanationBlock
  | CalloutBlock
  | ExampleBlock
  | ActivityReferenceBlock
  | RecapBlock
  | TransferChallengeBlock;

export const SUPPORTED_LESSON_BLOCK_TYPES = [
  "explanation",
  "callout",
  "example",
  "single-answer-checkpoint",
  "ordering-checkpoint",
  "counter-simulation",
  "recap",
  "transfer-challenge",
] as const satisfies readonly TrustedLessonBlock["type"][];

export type SingleAnswerActivity = {
  type: "single-answer";
  id: string;
  title: string;
  question: string;
  options: readonly { id: string; label: string; feedback: string }[];
  correctOptionId: string;
  successMessage: string;
  hint: string;
};

export type OrderingActivity = {
  type: "ordering";
  id: string;
  title: string;
  prompt: string;
  items: readonly { id: string; label: string }[];
  correctOrder: readonly string[];
  successMessage: string;
  errorMessage: string;
};

export type CounterSimulationActivity = {
  type: "counter-simulation";
  id: string;
  title: string;
  instruction: string;
  buttonLabel: string;
  initialCount: number;
  targetCount: number;
  successMessage: string;
};

export type LessonActivity =
  | SingleAnswerActivity
  | OrderingActivity
  | CounterSimulationActivity;

export type GuidedLessonDefinitionStep = {
  id: string;
  title: string;
  eyebrow: string;
  blocks: readonly TrustedLessonBlock[];
  requiredActivityIds: readonly string[];
};

export type LessonCompletionRule = {
  type: "all-steps-and-required-activities";
  requiredActivityIds: readonly string[];
};

export type LessonContentDefinition = {
  schemaVersion: typeof LESSON_CONTENT_SCHEMA_VERSION;
  lessonSlug: string;
  lessonVersion: number;
  objective: string;
  prerequisites: readonly string[];
  learningOutcomes: readonly string[];
  misconception: string;
  guidedSteps: readonly GuidedLessonDefinitionStep[];
  activities: readonly LessonActivity[];
  completionRule: LessonCompletionRule;
  sources: readonly LessonSource[];
  sourceVerifiedAt: string | null;
};

export function isSupportedLessonBlockType(
  value: string,
): value is TrustedLessonBlock["type"] {
  return (SUPPORTED_LESSON_BLOCK_TYPES as readonly string[]).includes(value);
}
