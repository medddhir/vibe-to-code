import { getLessonStorageKey } from "@/lib/lesson-progress-storage";
import {
  FOUNDATION_CURRICULUM_VERSION,
  FOUNDATION_LEGACY_CURRICULUM_VERSION,
  FOUNDATION_PROGRESS_LEVEL1_LESSON_SLUGS,
  FOUNDATION_PROGRESS_MANIFEST,
  FOUNDATION_PROGRESS_MANIFEST_VERSION_2,
  FOUNDATION_PROGRESS_MANIFEST_VERSION_3,
  FOUNDATION_PROGRESS_SCHEMA_VERSION,
  FOUNDATION_PREVIOUS_CURRICULUM_VERSION,
  getFoundationKnownProgressIds,
  getFoundationProgressLessonManifest,
  type FoundationProgressLessonSlug,
  type FoundationProgressLessonManifest,
} from "@/lib/progress-manifest";

export const MAX_SAVED_CODE_UNITS = 10_000;
export const MAX_SAVED_CODE_BYTES = 40_000;
export const HISTORICAL_MAX_CANONICAL_PROGRESS_BYTES = 1_000_000;
export const MAX_CANONICAL_PROGRESS_BYTES = 1_048_576;
export const MAX_COUNTER_COMPONENT = 1_000_000;
export const MAX_COUNTER_DEVICES = 32;

const MAX_EPOCH_OR_REVISION = 1_000_000_000;
const MAX_ID_LENGTH = 128;
const MAX_CLIENT_CLOCK_SKEW_MS = 24 * 60 * 60 * 1_000;
const FOUNDATION_COURSE_SLUG = "foundations";
const LEGACY_COURSE_STORAGE_KEY = "vibe-to-code:course-progress:v1:foundations";

export type TimestampedValue<T> = {
  value: T;
  updatedAt: string;
};

export type ProgressCounterComponents = Record<string, number>;

export type CanonicalLessonVersionProgress = {
  lessonVersion: number;
  currentStep: TimestampedValue<string> | null;
  completedStepsAt: Record<string, string>;
  completedActivitiesAt: Record<string, string>;
  attempts: Record<string, ProgressCounterComponents>;
  hints: Record<string, ProgressCounterComponents>;
  savedCode: Record<string, TimestampedValue<string | null>>;
};

export type CanonicalLessonProgress = {
  lessonEpoch: number;
  completedAt: string | null;
  versions: Record<string, CanonicalLessonVersionProgress>;
};

export type CanonicalFoundationProgress = {
  schemaVersion: typeof FOUNDATION_PROGRESS_SCHEMA_VERSION;
  courseSlug: typeof FOUNDATION_COURSE_SLUG;
  curriculumVersion: typeof FOUNDATION_CURRICULUM_VERSION;
  courseEpoch: number;
  revision: number;
  legacyLevel1Access: boolean;
  lastVisited: TimestampedValue<FoundationProgressLessonSlug> | null;
  lessons: Record<FoundationProgressLessonSlug, CanonicalLessonProgress>;
  updatedAt: string;
};

export type CanonicalFoundationProgressSummary = {
  completedLessons: FoundationProgressLessonSlug[];
  completedLessonCount: number;
  totalLessonCount: number;
  coursePercent: number;
  lessonStats: Record<
    FoundationProgressLessonSlug,
    {
      completed: boolean;
      completedStepCount: number;
      completedActivityCount: number;
      totalAttempts: number;
      totalHints: number;
    }
  >;
};

export type FoundationProgressResetScope =
  | { scope: "course" }
  | { scope: "lesson"; lessonSlug: FoundationProgressLessonSlug };

export type LegacyFoundationProgressInput = {
  aggregate: unknown;
  detailedByStorageKey: Readonly<Record<string, unknown>>;
  deviceId: string;
  importedAt: string;
  baseline?: unknown;
};

class ProgressValidationError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseStoredValue(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function serializedBytes(value: unknown) {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function isValidTimestamp(value: unknown): value is string {
  const parsed = typeof value === "string" ? Date.parse(value) : Number.NaN;

  return (
    typeof value === "string" &&
    value.length >= 20 &&
    value.length <= 40 &&
    Number.isFinite(parsed) &&
    parsed <= Date.now() + MAX_CLIENT_CLOCK_SKEW_MS
  );
}

function timestampOr(value: unknown, fallback: string) {
  return isValidTimestamp(value) ? value : fallback;
}

function earliestTimestamp(left: string | null, right: string | null) {
  if (!left) return right;
  if (!right) return left;
  return Date.parse(left) <= Date.parse(right) ? left : right;
}

function latestTimestamp(left: string, right: string) {
  return Date.parse(left) >= Date.parse(right) ? left : right;
}

function assertValidTimestamp(value: unknown, field: string): asserts value is string {
  if (!isValidTimestamp(value)) {
    throw new ProgressValidationError(`${field} must be an ISO timestamp`);
  }
}

function assertSafeInteger(
  value: unknown,
  field: string,
  maximum = MAX_EPOCH_OR_REVISION,
): asserts value is number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > maximum
  ) {
    throw new ProgressValidationError(`${field} must be a bounded non-negative integer`);
  }
}

function assertOpaqueId(value: string, field: string) {
  if (!value || value.length > MAX_ID_LENGTH || !/^[A-Za-z0-9._:-]+$/.test(value)) {
    throw new ProgressValidationError(`${field} is not a valid opaque ID`);
  }
}

function isBoundedSavedCode(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= MAX_SAVED_CODE_UNITS &&
    new TextEncoder().encode(value).length <= MAX_SAVED_CODE_BYTES
  );
}

function uniqueKnownStrings(value: unknown, known: ReadonlySet<string>) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value.filter(
        (item): item is string => typeof item === "string" && known.has(item),
      ),
    ),
  ];
}

function boundedCounter(value: unknown) {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= MAX_COUNTER_COMPONENT
    ? value
    : null;
}

function makeEmptyVersionProgress(
  lessonVersion: number,
): CanonicalLessonVersionProgress {
  return {
    lessonVersion,
    currentStep: null,
    completedStepsAt: {},
    completedActivitiesAt: {},
    attempts: {},
    hints: {},
    savedCode: {},
  };
}

function makeEmptyLessonProgress(
  lessonVersion: number,
): CanonicalLessonProgress {
  return {
    lessonEpoch: 0,
    completedAt: null,
    versions: {
      [String(lessonVersion)]: makeEmptyVersionProgress(lessonVersion),
    },
  };
}

export function createEmptyCanonicalFoundationProgress(
  updatedAt: string,
): CanonicalFoundationProgress {
  assertValidTimestamp(updatedAt, "updatedAt");

  return {
    schemaVersion: FOUNDATION_PROGRESS_SCHEMA_VERSION,
    courseSlug: FOUNDATION_COURSE_SLUG,
    curriculumVersion: FOUNDATION_CURRICULUM_VERSION,
    courseEpoch: 0,
    revision: 0,
    legacyLevel1Access: false,
    lastVisited: null,
    lessons: Object.fromEntries(
      FOUNDATION_PROGRESS_MANIFEST.map((lesson) => [
        lesson.slug,
        makeEmptyLessonProgress(lesson.lessonVersion),
      ]),
    ) as Record<FoundationProgressLessonSlug, CanonicalLessonProgress>,
    updatedAt,
  };
}

function readLegacyAggregate(raw: unknown) {
  const parsed = parseStoredValue(raw);
  if (!isRecord(parsed) || parsed.version !== 1) {
    return null;
  }

  if (
    parsed.courseVersion !== 1 &&
    parsed.courseVersion !== FOUNDATION_LEGACY_CURRICULUM_VERSION &&
    parsed.courseVersion !== FOUNDATION_PREVIOUS_CURRICULUM_VERSION &&
    parsed.courseVersion !== FOUNDATION_CURRICULUM_VERSION
  ) {
    return null;
  }

  return parsed;
}

function readLegacyDetail(raw: unknown, lessonVersion: number) {
  const parsed = parseStoredValue(raw);
  if (
    !isRecord(parsed) ||
    parsed.version !== 1 ||
    parsed.lessonVersion !== lessonVersion
  ) {
    return null;
  }

  return parsed;
}

function readLegacyObject(value: unknown) {
  return isRecord(value) ? value : {};
}

function setImportedCounter(
  target: Record<string, ProgressCounterComponents>,
  progressId: string,
  deviceId: string,
  aggregateValue: unknown,
  detailValue: unknown,
) {
  const aggregateCount = boundedCounter(aggregateValue);
  const detailCount = boundedCounter(detailValue);
  const count = Math.max(aggregateCount ?? 0, detailCount ?? 0);

  if (count > 0) {
    target[progressId] = { [deviceId]: count };
  }
}

export function convertLegacyFoundationProgress({
  aggregate: aggregateInput,
  detailedByStorageKey,
  deviceId,
  importedAt,
  baseline: baselineInput,
}: LegacyFoundationProgressInput): CanonicalFoundationProgress {
  assertOpaqueId(deviceId, "deviceId");
  assertValidTimestamp(importedAt, "importedAt");

  const canonical = createEmptyCanonicalFoundationProgress(importedAt);
  const baseline = baselineInput == null
    ? null
    : parseCanonicalFoundationProgress(baselineInput);
  if (baseline) {
    canonical.courseEpoch = baseline.courseEpoch;
    canonical.revision = baseline.revision;
    for (const lesson of FOUNDATION_PROGRESS_MANIFEST) {
      canonical.lessons[lesson.slug].lessonEpoch =
        baseline.lessons[lesson.slug].lessonEpoch;
    }
  }
  const aggregate = readLegacyAggregate(aggregateInput);
  const aggregateLessons = readLegacyObject(aggregate?.lessons);
  const aggregateUpdatedAt = timestampOr(aggregate?.updatedAt, importedAt);

  canonical.legacyLevel1Access = aggregate?.legacyLevel1Access === true;

  if (
    typeof aggregate?.lastVisitedLesson === "string" &&
    getFoundationProgressLessonManifest(aggregate.lastVisitedLesson)
  ) {
    canonical.lastVisited = {
      value: aggregate.lastVisitedLesson as FoundationProgressLessonSlug,
      updatedAt:
        baseline?.lastVisited?.value === aggregate.lastVisitedLesson
          ? baseline.lastVisited.updatedAt
          : aggregateUpdatedAt,
    };
  }

  for (const manifestLesson of FOUNDATION_PROGRESS_MANIFEST) {
    const lessonSlug = manifestLesson.slug;
    const canonicalLesson = canonical.lessons[lessonSlug];
    const canonicalVersion = canonicalLesson.versions[String(manifestLesson.lessonVersion)];
    const baselineVersion = baseline?.lessons[lessonSlug].versions[
      String(manifestLesson.lessonVersion)
    ];
    const aggregateLesson = readLegacyObject(aggregateLessons[lessonSlug]);
    const detailKey = getLessonStorageKey(lessonSlug, manifestLesson.lessonVersion);
    const detail = readLegacyDetail(
      detailedByStorageKey[detailKey],
      manifestLesson.lessonVersion,
    );
    const stepIds = new Set<string>(manifestLesson.stepIds);
    const knownIds = new Set<string>(getFoundationKnownProgressIds(lessonSlug));
    const aggregateAttempts = readLegacyObject(aggregateLesson.stepAttempts);
    const detailAttempts = readLegacyObject(detail?.attemptsByStep);
    const aggregateHints = readLegacyObject(aggregateLesson.stepHints);
    const completedSteps = uniqueKnownStrings(detail?.completedStepIds, stepIds);
    const completedActivities = new Set([
      ...uniqueKnownStrings(detail?.practiceCompletedIds, knownIds),
      ...uniqueKnownStrings(aggregateLesson.completedCheckpointIds, knownIds),
    ]);

    canonicalLesson.completedAt = earliestTimestamp(
      isValidTimestamp(aggregateLesson.completedAt)
        ? aggregateLesson.completedAt
        : null,
      isValidTimestamp(detail?.completedAt) ? detail.completedAt : null,
    );

    for (const progressId of completedSteps) {
      canonicalVersion.completedStepsAt[progressId] =
        baselineVersion?.completedStepsAt[progressId] ?? importedAt;
    }

    for (const progressId of completedActivities) {
      canonicalVersion.completedActivitiesAt[progressId] =
        baselineVersion?.completedActivitiesAt[progressId] ?? importedAt;
    }

    const detailCurrentStep = typeof detail?.currentStepId === "string" &&
      stepIds.has(detail.currentStepId)
      ? detail.currentStepId
      : null;
    const aggregateCurrentStep = typeof aggregateLesson.currentCheckpoint === "string" &&
      stepIds.has(aggregateLesson.currentCheckpoint)
      ? aggregateLesson.currentCheckpoint
      : null;
    const currentStep = detailCurrentStep ?? aggregateCurrentStep;

    if (currentStep) {
      canonicalVersion.currentStep = {
        value: currentStep,
        updatedAt:
          baselineVersion?.currentStep?.value === currentStep
            ? baselineVersion.currentStep.updatedAt
            : importedAt,
      };
    }

    for (const progressId of knownIds) {
      setImportedCounter(
        canonicalVersion.attempts,
        progressId,
        deviceId,
        aggregateAttempts[progressId],
        detailAttempts[progressId],
      );
      setImportedCounter(
        canonicalVersion.hints,
        progressId,
        deviceId,
        aggregateHints[progressId],
        undefined,
      );
    }

    const savedCode = readLegacyObject(detail?.savedCodeByStep);
    for (const [progressId, code] of Object.entries(savedCode)) {
      if (knownIds.has(progressId) && isBoundedSavedCode(code)) {
        const baselineDraft = baselineVersion?.savedCode[progressId];
        canonicalVersion.savedCode[progressId] = {
          value: code,
          updatedAt:
            baselineDraft?.value === code
              ? baselineDraft.updatedAt
              : importedAt,
        };
      }
    }
  }

  if (aggregate?.courseVersion === 1 && !canonical.legacyLevel1Access) {
    canonical.legacyLevel1Access = FOUNDATION_PROGRESS_LEVEL1_LESSON_SLUGS.some(
      (lessonSlug) => {
        const lesson = canonical.lessons[lessonSlug];
        const manifestLesson = getFoundationProgressLessonManifest(lessonSlug);
        if (!manifestLesson) return false;
        const progress = lesson.versions[String(manifestLesson.lessonVersion)];
        return Boolean(
          lesson.completedAt ||
            progress.currentStep ||
            Object.keys(progress.completedStepsAt).length ||
            Object.keys(progress.completedActivitiesAt).length ||
            Object.keys(progress.attempts).length ||
            Object.keys(progress.hints).length ||
            Object.keys(progress.savedCode).length ||
            canonical.lastVisited?.value === lessonSlug,
        );
      },
    );
  }

  return canonical;
}

function parseTimestampMap(
  value: unknown,
  allowedIds: ReadonlySet<string>,
  field: string,
) {
  if (!isRecord(value)) {
    throw new ProgressValidationError(`${field} must be an object`);
  }

  const result: Record<string, string> = {};
  for (const [id, timestamp] of Object.entries(value)) {
    if (!allowedIds.has(id)) {
      throw new ProgressValidationError(`${field} contains an unknown progress ID`);
    }
    assertValidTimestamp(timestamp, `${field}.${id}`);
    result[id] = timestamp;
  }
  return result;
}

function parseCounterMap(
  value: unknown,
  allowedIds: ReadonlySet<string>,
  field: string,
) {
  if (!isRecord(value)) {
    throw new ProgressValidationError(`${field} must be an object`);
  }

  const result: Record<string, ProgressCounterComponents> = {};
  for (const [progressId, rawComponents] of Object.entries(value)) {
    if (!allowedIds.has(progressId) || !isRecord(rawComponents)) {
      throw new ProgressValidationError(`${field} contains invalid progress data`);
    }

    const components = Object.entries(rawComponents);
    if (components.length > MAX_COUNTER_DEVICES) {
      throw new ProgressValidationError(`${field} has too many device components`);
    }

    result[progressId] = {};
    for (const [deviceId, count] of components) {
      assertOpaqueId(deviceId, `${field}.${progressId}.deviceId`);
      assertSafeInteger(count, `${field}.${progressId}.${deviceId}`, MAX_COUNTER_COMPONENT);
      result[progressId][deviceId] = count;
    }
  }

  return result;
}

function parseTimestampedString(
  value: unknown,
  allowedValues: ReadonlySet<string>,
  field: string,
) {
  if (value === null) {
    return null;
  }
  if (!isRecord(value) || typeof value.value !== "string" || !allowedValues.has(value.value)) {
    throw new ProgressValidationError(`${field} contains an unknown value`);
  }
  assertValidTimestamp(value.updatedAt, `${field}.updatedAt`);
  return { value: value.value, updatedAt: value.updatedAt };
}

function parseSavedCode(
  value: unknown,
  allowedIds: ReadonlySet<string>,
  field: string,
) {
  if (!isRecord(value)) {
    throw new ProgressValidationError(`${field} must be an object`);
  }

  const result: Record<string, TimestampedValue<string | null>> = {};
  for (const [progressId, rawDraft] of Object.entries(value)) {
    if (!allowedIds.has(progressId) || !isRecord(rawDraft)) {
      throw new ProgressValidationError(`${field} contains invalid saved code`);
    }
    if (rawDraft.value !== null && !isBoundedSavedCode(rawDraft.value)) {
      throw new ProgressValidationError(`${field}.${progressId} exceeds saved-code limits`);
    }
    assertValidTimestamp(rawDraft.updatedAt, `${field}.${progressId}.updatedAt`);
    result[progressId] = {
      value: rawDraft.value,
      updatedAt: rawDraft.updatedAt,
    };
  }
  return result;
}

type ParsedCanonicalFoundationProgress = Omit<
  CanonicalFoundationProgress,
  "curriculumVersion" | "lastVisited" | "lessons"
> & {
  curriculumVersion: number;
  lastVisited: TimestampedValue<string> | null;
  lessons: Record<string, CanonicalLessonProgress>;
};

function parseCanonicalFoundationProgressVersion(
  input: unknown,
  curriculumVersion: number,
  manifest: readonly FoundationProgressLessonManifest[],
  maximumBytes: number,
): ParsedCanonicalFoundationProgress {
  if (serializedBytes(input) > maximumBytes || !isRecord(input)) {
    throw new ProgressValidationError("Canonical progress payload is invalid or too large");
  }
  if (
    input.schemaVersion !== FOUNDATION_PROGRESS_SCHEMA_VERSION ||
    input.courseSlug !== FOUNDATION_COURSE_SLUG ||
    input.curriculumVersion !== curriculumVersion ||
    typeof input.legacyLevel1Access !== "boolean" ||
    !isRecord(input.lessons)
  ) {
    throw new ProgressValidationError("Canonical progress header is invalid");
  }

  assertSafeInteger(input.courseEpoch, "courseEpoch");
  assertSafeInteger(input.revision, "revision");
  assertValidTimestamp(input.updatedAt, "updatedAt");

  const expectedSlugs = new Set<string>(manifest.map((lesson) => lesson.slug));
  const actualSlugs = Object.keys(input.lessons);
  if (
    actualSlugs.length !== expectedSlugs.size ||
    actualSlugs.some((slug) => !expectedSlugs.has(slug))
  ) {
    throw new ProgressValidationError("Canonical progress contains unknown or missing lessons");
  }

  const lastVisited = parseTimestampedString(
    input.lastVisited,
    expectedSlugs,
    "lastVisited",
  );
  const lessons: Record<string, CanonicalLessonProgress> = {};

  for (const manifestLesson of manifest) {
    const rawLesson = input.lessons[manifestLesson.slug];
    if (!isRecord(rawLesson) || !isRecord(rawLesson.versions)) {
      throw new ProgressValidationError(`lessons.${manifestLesson.slug} is invalid`);
    }
    assertSafeInteger(rawLesson.lessonEpoch, `lessons.${manifestLesson.slug}.lessonEpoch`);

    const versionKey = String(manifestLesson.lessonVersion);
    if (
      Object.keys(rawLesson.versions).length !== 1 ||
      !isRecord(rawLesson.versions[versionKey])
    ) {
      throw new ProgressValidationError(`lessons.${manifestLesson.slug} has an invalid lesson version`);
    }
    const rawVersion = rawLesson.versions[versionKey];
    if (rawVersion.lessonVersion !== manifestLesson.lessonVersion) {
      throw new ProgressValidationError(`lessons.${manifestLesson.slug} has a mismatched lesson version`);
    }

    const stepIds = new Set<string>(manifestLesson.stepIds);
    const knownIds = new Set<string>([
      ...manifestLesson.stepIds,
      ...manifestLesson.activityIds,
    ]);
    const completedAt = rawLesson.completedAt;
    if (completedAt !== null) {
      assertValidTimestamp(completedAt, `lessons.${manifestLesson.slug}.completedAt`);
    }

    lessons[manifestLesson.slug] = {
      lessonEpoch: rawLesson.lessonEpoch,
      completedAt,
      versions: {
        [versionKey]: {
          lessonVersion: manifestLesson.lessonVersion,
          currentStep: parseTimestampedString(
            rawVersion.currentStep,
            stepIds,
            `lessons.${manifestLesson.slug}.currentStep`,
          ),
          completedStepsAt: parseTimestampMap(
            rawVersion.completedStepsAt,
            stepIds,
            `lessons.${manifestLesson.slug}.completedStepsAt`,
          ),
          completedActivitiesAt: parseTimestampMap(
            rawVersion.completedActivitiesAt,
            knownIds,
            `lessons.${manifestLesson.slug}.completedActivitiesAt`,
          ),
          attempts: parseCounterMap(
            rawVersion.attempts,
            knownIds,
            `lessons.${manifestLesson.slug}.attempts`,
          ),
          hints: parseCounterMap(
            rawVersion.hints,
            knownIds,
            `lessons.${manifestLesson.slug}.hints`,
          ),
          savedCode: parseSavedCode(
            rawVersion.savedCode,
            knownIds,
            `lessons.${manifestLesson.slug}.savedCode`,
          ),
        },
      },
    };
  }

  return {
    schemaVersion: FOUNDATION_PROGRESS_SCHEMA_VERSION,
    courseSlug: FOUNDATION_COURSE_SLUG,
    curriculumVersion,
    courseEpoch: input.courseEpoch,
    revision: input.revision,
    legacyLevel1Access: input.legacyLevel1Access,
    lastVisited,
    lessons,
    updatedAt: input.updatedAt,
  };
}

function upgradeCanonicalFoundationProgress(
  parsed: ParsedCanonicalFoundationProgress,
  previousManifest: readonly FoundationProgressLessonManifest[],
): CanonicalFoundationProgress {
  const upgraded = createEmptyCanonicalFoundationProgress(parsed.updatedAt);
  upgraded.courseEpoch = parsed.courseEpoch;
  upgraded.revision = parsed.revision;
  upgraded.legacyLevel1Access = parsed.legacyLevel1Access;
  upgraded.lastVisited = parsed.lastVisited as TimestampedValue<FoundationProgressLessonSlug> | null;

  for (const lesson of previousManifest) {
    upgraded.lessons[lesson.slug as FoundationProgressLessonSlug] = structuredClone(
      parsed.lessons[lesson.slug],
    );
  }

  return parseCanonicalFoundationProgressVersion(
    upgraded,
    FOUNDATION_CURRICULUM_VERSION,
    FOUNDATION_PROGRESS_MANIFEST,
    MAX_CANONICAL_PROGRESS_BYTES,
  ) as CanonicalFoundationProgress;
}

export function parseCanonicalFoundationProgress(
  input: unknown,
): CanonicalFoundationProgress {
  if (isRecord(input) && input.curriculumVersion === FOUNDATION_LEGACY_CURRICULUM_VERSION) {
    return upgradeCanonicalFoundationProgress(
      parseCanonicalFoundationProgressVersion(
        input,
        FOUNDATION_LEGACY_CURRICULUM_VERSION,
        FOUNDATION_PROGRESS_MANIFEST_VERSION_2,
        HISTORICAL_MAX_CANONICAL_PROGRESS_BYTES,
      ),
      FOUNDATION_PROGRESS_MANIFEST_VERSION_2,
    );
  }

  if (isRecord(input) && input.curriculumVersion === FOUNDATION_PREVIOUS_CURRICULUM_VERSION) {
    return upgradeCanonicalFoundationProgress(
      parseCanonicalFoundationProgressVersion(
        input,
        FOUNDATION_PREVIOUS_CURRICULUM_VERSION,
        FOUNDATION_PROGRESS_MANIFEST_VERSION_3,
        HISTORICAL_MAX_CANONICAL_PROGRESS_BYTES,
      ),
      FOUNDATION_PROGRESS_MANIFEST_VERSION_3,
    );
  }

  return parseCanonicalFoundationProgressVersion(
    input,
    FOUNDATION_CURRICULUM_VERSION,
    FOUNDATION_PROGRESS_MANIFEST,
    MAX_CANONICAL_PROGRESS_BYTES,
  ) as CanonicalFoundationProgress;
}

export function normalizeCanonicalFoundationProgress(input: unknown) {
  try {
    return parseCanonicalFoundationProgress(input);
  } catch {
    return null;
  }
}

function mergeTimestampedValue<T>(
  left: TimestampedValue<T> | null,
  right: TimestampedValue<T> | null,
) {
  if (!left) return right;
  if (!right) return left;

  const leftTime = Date.parse(left.updatedAt);
  const rightTime = Date.parse(right.updatedAt);
  if (leftTime !== rightTime) {
    return leftTime > rightTime ? left : right;
  }

  return JSON.stringify(left.value) >= JSON.stringify(right.value) ? left : right;
}

function mergeTimestampMaps(
  left: Record<string, string>,
  right: Record<string, string>,
) {
  const result = { ...left };
  for (const [id, timestamp] of Object.entries(right)) {
    result[id] = earliestTimestamp(result[id] ?? null, timestamp) ?? timestamp;
  }
  return result;
}

function mergeCounterMaps(
  left: Record<string, ProgressCounterComponents>,
  right: Record<string, ProgressCounterComponents>,
) {
  const result: Record<string, ProgressCounterComponents> = {};

  for (const progressId of new Set([...Object.keys(left), ...Object.keys(right)])) {
    const components = { ...(left[progressId] ?? {}) };
    for (const [deviceId, count] of Object.entries(right[progressId] ?? {})) {
      components[deviceId] = Math.max(components[deviceId] ?? 0, count);
    }
    result[progressId] = components;
  }

  return result;
}

function mergeSavedCode(
  left: Record<string, TimestampedValue<string | null>>,
  right: Record<string, TimestampedValue<string | null>>,
) {
  const result: Record<string, TimestampedValue<string | null>> = {};
  for (const progressId of new Set([...Object.keys(left), ...Object.keys(right)])) {
    const merged = mergeTimestampedValue(
      left[progressId] ?? null,
      right[progressId] ?? null,
    );
    if (merged) result[progressId] = merged;
  }
  return result;
}

export function mergeCanonicalFoundationProgress(
  leftInput: unknown,
  rightInput: unknown,
): CanonicalFoundationProgress {
  const left = parseCanonicalFoundationProgress(leftInput);
  const right = parseCanonicalFoundationProgress(rightInput);

  if (left.courseEpoch !== right.courseEpoch) {
    return structuredClone(left.courseEpoch > right.courseEpoch ? left : right);
  }

  const merged = createEmptyCanonicalFoundationProgress(
    latestTimestamp(left.updatedAt, right.updatedAt),
  );
  merged.courseEpoch = left.courseEpoch;
  merged.revision = Math.max(left.revision, right.revision);
  merged.legacyLevel1Access = left.legacyLevel1Access || right.legacyLevel1Access;
  merged.lastVisited = mergeTimestampedValue(left.lastVisited, right.lastVisited);

  for (const manifestLesson of FOUNDATION_PROGRESS_MANIFEST) {
    const leftLesson = left.lessons[manifestLesson.slug];
    const rightLesson = right.lessons[manifestLesson.slug];

    if (leftLesson.lessonEpoch !== rightLesson.lessonEpoch) {
      merged.lessons[manifestLesson.slug] = structuredClone(
        leftLesson.lessonEpoch > rightLesson.lessonEpoch ? leftLesson : rightLesson,
      );
      continue;
    }

    const versionKey = String(manifestLesson.lessonVersion);
    const leftVersion = leftLesson.versions[versionKey];
    const rightVersion = rightLesson.versions[versionKey];

    merged.lessons[manifestLesson.slug] = {
      lessonEpoch: leftLesson.lessonEpoch,
      completedAt: earliestTimestamp(leftLesson.completedAt, rightLesson.completedAt),
      versions: {
        [versionKey]: {
          lessonVersion: manifestLesson.lessonVersion,
          currentStep: mergeTimestampedValue(
            leftVersion.currentStep,
            rightVersion.currentStep,
          ),
          completedStepsAt: mergeTimestampMaps(
            leftVersion.completedStepsAt,
            rightVersion.completedStepsAt,
          ),
          completedActivitiesAt: mergeTimestampMaps(
            leftVersion.completedActivitiesAt,
            rightVersion.completedActivitiesAt,
          ),
          attempts: mergeCounterMaps(leftVersion.attempts, rightVersion.attempts),
          hints: mergeCounterMaps(leftVersion.hints, rightVersion.hints),
          savedCode: mergeSavedCode(leftVersion.savedCode, rightVersion.savedCode),
        },
      },
    };
  }

  return parseCanonicalFoundationProgress(merged);
}

export function canonicalFoundationProgressDocumentsMatch(
  leftInput: unknown,
  rightInput: unknown,
) {
  const clean = (input: unknown) => {
    const copy = parseCanonicalFoundationProgress(input);
    copy.revision = 0;
    copy.updatedAt = "2000-01-01T00:00:00.000Z";
    return JSON.stringify(copy);
  };

  return clean(leftInput) === clean(rightInput);
}

/**
 * Merges edits collected after a sync request began without allowing stale
 * client epochs or revisions to undo a server-acknowledged reset.
 */
export function reconcileCanonicalFoundationProgressWithServer(
  serverInput: unknown,
  latestLocalInput: unknown,
  updatedAt: string,
) {
  const server = parseCanonicalFoundationProgress(serverInput);
  const merged = mergeCanonicalFoundationProgress(server, latestLocalInput);

  merged.courseEpoch = server.courseEpoch;
  merged.revision = server.revision;

  for (const manifestLesson of FOUNDATION_PROGRESS_MANIFEST) {
    const serverLesson = server.lessons[manifestLesson.slug];
    if (merged.lessons[manifestLesson.slug].lessonEpoch !== serverLesson.lessonEpoch) {
      merged.lessons[manifestLesson.slug] = structuredClone(serverLesson);
    }
  }

  merged.updatedAt = canonicalFoundationProgressDocumentsMatch(merged, server)
    ? server.updatedAt
    : updatedAt;
  return parseCanonicalFoundationProgress(merged);
}

/**
 * Reconciles a server-derived checkpoint with the checkpoint already shared by
 * another tab. Revisions are assigned only by the server, so a higher cached
 * revision is a newer concurrency authority and must never be downgraded by a
 * late response. Equal revisions can still contain unsynced local edits and
 * are merged under the response's server epochs.
 */
export function reconcileCanonicalFoundationProgressCheckpoint(
  candidateInput: unknown,
  cachedInput: unknown | null,
  updatedAt: string,
) {
  const candidate = parseCanonicalFoundationProgress(candidateInput);
  if (cachedInput == null) {
    return {
      cachedRevisionWasNewer: false,
      progress: candidate,
    };
  }

  const cached = parseCanonicalFoundationProgress(cachedInput);
  const cachedRevisionWasNewer = cached.revision > candidate.revision;
  const authority = cachedRevisionWasNewer ? cached : candidate;
  const combined = mergeCanonicalFoundationProgress(candidate, cached);

  return {
    cachedRevisionWasNewer,
    progress: reconcileCanonicalFoundationProgressWithServer(
      authority,
      combined,
      updatedAt,
    ),
  };
}

/** Shared v1 stores may be projected only for the still-active account, with
 * one exception: a first-account guest claim owns edits made while it runs. */
export function canProjectFoundationProgressForPrincipal(
  activePrincipal: string,
  requestPrincipal: string,
  claimedGuest: boolean,
) {
  return activePrincipal === requestPrincipal ||
    (claimedGuest && activePrincipal === "guest");
}

function subtractCounterMaps(
  current: Record<string, ProgressCounterComponents>,
  claimed: Record<string, ProgressCounterComponents>,
) {
  const residual: Record<string, ProgressCounterComponents> = {};
  for (const [progressId, components] of Object.entries(current)) {
    const remaining = Object.fromEntries(
      Object.entries(components)
        .map(([device, count]) => [
          device,
          Math.max(0, count - (claimed[progressId]?.[device] ?? 0)),
        ] as const)
        .filter(([, count]) => count > 0),
    );
    if (Object.keys(remaining).length) residual[progressId] = remaining;
  }
  return residual;
}

/** Removes the exact guest snapshot claimed by an account while retaining
 * bounded progress created after that claim began. */
export function subtractClaimedGuestProgress(
  currentInput: unknown,
  claimedInput: unknown,
) {
  const current = parseCanonicalFoundationProgress(currentInput);
  const claimed = parseCanonicalFoundationProgress(claimedInput);
  const residual = createEmptyCanonicalFoundationProgress(current.updatedAt);

  residual.legacyLevel1Access = current.legacyLevel1Access && !claimed.legacyLevel1Access;
  if (
    current.lastVisited &&
    (!claimed.lastVisited ||
      current.lastVisited.value !== claimed.lastVisited.value ||
      Date.parse(current.lastVisited.updatedAt) > Date.parse(claimed.lastVisited.updatedAt))
  ) {
    residual.lastVisited = structuredClone(current.lastVisited);
  }

  for (const manifestLesson of FOUNDATION_PROGRESS_MANIFEST) {
    const currentLesson = current.lessons[manifestLesson.slug];
    const claimedLesson = claimed.lessons[manifestLesson.slug];
    const residualLesson = residual.lessons[manifestLesson.slug];
    const versionKey = String(manifestLesson.lessonVersion);
    const currentVersion = currentLesson.versions[versionKey];
    const claimedVersion = claimedLesson.versions[versionKey];
    const residualVersion = residualLesson.versions[versionKey];

    residualLesson.completedAt = currentLesson.completedAt &&
      (!claimedLesson.completedAt ||
        Date.parse(currentLesson.completedAt) > Date.parse(claimedLesson.completedAt))
      ? currentLesson.completedAt
      : null;
    residualVersion.completedStepsAt = Object.fromEntries(
      Object.entries(currentVersion.completedStepsAt).filter(
        ([id, timestamp]) =>
          !claimedVersion.completedStepsAt[id] ||
          Date.parse(timestamp) > Date.parse(claimedVersion.completedStepsAt[id]),
      ),
    );
    residualVersion.completedActivitiesAt = Object.fromEntries(
      Object.entries(currentVersion.completedActivitiesAt).filter(
        ([id, timestamp]) =>
          !claimedVersion.completedActivitiesAt[id] ||
          Date.parse(timestamp) > Date.parse(claimedVersion.completedActivitiesAt[id]),
      ),
    );
    if (
      currentVersion.currentStep &&
      (!claimedVersion.currentStep ||
        currentVersion.currentStep.value !== claimedVersion.currentStep.value ||
        Date.parse(currentVersion.currentStep.updatedAt) >
          Date.parse(claimedVersion.currentStep.updatedAt))
    ) {
      residualVersion.currentStep = structuredClone(currentVersion.currentStep);
    }
    residualVersion.attempts = subtractCounterMaps(
      currentVersion.attempts,
      claimedVersion.attempts,
    );
    residualVersion.hints = subtractCounterMaps(
      currentVersion.hints,
      claimedVersion.hints,
    );
    residualVersion.savedCode = Object.fromEntries(
      Object.entries(currentVersion.savedCode).filter(([id, draft]) => {
        const oldDraft = claimedVersion.savedCode[id];
        return !oldDraft ||
          draft.value !== oldDraft.value ||
          Date.parse(draft.updatedAt) > Date.parse(oldDraft.updatedAt);
      }),
    );
  }

  return parseCanonicalFoundationProgress(residual);
}

function sumCounterComponents(counters: Record<string, ProgressCounterComponents>) {
  return Object.values(counters).reduce(
    (total, components) =>
      total + Object.values(components).reduce((sum, value) => sum + value, 0),
    0,
  );
}

export function deriveCanonicalFoundationProgressSummary(
  input: unknown,
): CanonicalFoundationProgressSummary {
  const canonical = parseCanonicalFoundationProgress(input);
  const completedLessons = FOUNDATION_PROGRESS_MANIFEST.filter(
    (lesson) => Boolean(canonical.lessons[lesson.slug].completedAt),
  ).map((lesson) => lesson.slug);
  const lessonStats = Object.fromEntries(
    FOUNDATION_PROGRESS_MANIFEST.map((lesson) => {
      const progress = canonical.lessons[lesson.slug];
      const version = progress.versions[String(lesson.lessonVersion)];
      return [
        lesson.slug,
        {
          completed: Boolean(progress.completedAt),
          completedStepCount: Object.keys(version.completedStepsAt).length,
          completedActivityCount: Object.keys(version.completedActivitiesAt).length,
          totalAttempts: sumCounterComponents(version.attempts),
          totalHints: sumCounterComponents(version.hints),
        },
      ];
    }),
  ) as CanonicalFoundationProgressSummary["lessonStats"];

  return {
    completedLessons,
    completedLessonCount: completedLessons.length,
    totalLessonCount: FOUNDATION_PROGRESS_MANIFEST.length,
    coursePercent: Math.round(
      (completedLessons.length / FOUNDATION_PROGRESS_MANIFEST.length) * 100,
    ),
    lessonStats,
  };
}

function isCanonicalLessonEmpty(lesson: CanonicalLessonProgress) {
  if (lesson.completedAt) return false;

  return Object.values(lesson.versions).every(
    (version) =>
      version.currentStep === null &&
      Object.keys(version.completedStepsAt).length === 0 &&
      Object.keys(version.completedActivitiesAt).length === 0 &&
      Object.keys(version.attempts).length === 0 &&
      Object.keys(version.hints).length === 0 &&
      Object.keys(version.savedCode).length === 0,
  );
}

export function applyAcknowledgedFoundationProgressReset(
  previousInput: unknown,
  serverInput: unknown,
  reset: FoundationProgressResetScope,
) {
  const previous = parseCanonicalFoundationProgress(previousInput);
  const server = parseCanonicalFoundationProgress(serverInput);

  if (server.revision <= previous.revision) return null;

  if (reset.scope === "course") {
    const isEmptyCourse =
      server.courseEpoch > previous.courseEpoch &&
      !server.legacyLevel1Access &&
      server.lastVisited === null &&
      FOUNDATION_PROGRESS_MANIFEST.every((lesson) =>
        isCanonicalLessonEmpty(server.lessons[lesson.slug]),
      );
    return isEmptyCourse ? server : null;
  }

  const manifestLesson = getFoundationProgressLessonManifest(reset.lessonSlug);
  if (!manifestLesson) return null;

  const previousLesson = previous.lessons[reset.lessonSlug];
  const serverLesson = server.lessons[reset.lessonSlug];
  const validEpochAdvance =
    server.courseEpoch > previous.courseEpoch ||
    (server.courseEpoch === previous.courseEpoch &&
      serverLesson.lessonEpoch > previousLesson.lessonEpoch);

  if (!validEpochAdvance || !isCanonicalLessonEmpty(serverLesson)) {
    return null;
  }

  const merged = mergeCanonicalFoundationProgress(server, previous);
  merged.courseEpoch = server.courseEpoch;
  merged.revision = server.revision;
  return parseCanonicalFoundationProgress(merged);
}

function progressPrincipalNamespace(internalUserId?: string | null) {
  if (internalUserId == null) {
    return "guest";
  }

  const normalized = internalUserId.trim();
  if (!normalized || normalized.length > 256) {
    throw new ProgressValidationError("internalUserId is invalid");
  }
  return `user:${encodeURIComponent(normalized)}`;
}

export function getCanonicalProgressStorageKey(internalUserId?: string | null) {
  return `vibe-to-code:progress:v2:${progressPrincipalNamespace(internalUserId)}:${FOUNDATION_COURSE_SLUG}`;
}

export function getLegacyImportFingerprintStorageKey(
  internalUserId: string,
  deviceId: string,
) {
  assertOpaqueId(deviceId, "deviceId");
  return `vibe-to-code:progress:v2:${progressPrincipalNamespace(internalUserId)}:legacy-import:${encodeURIComponent(deviceId)}`;
}

function stableJsonValue(value: unknown, seen: WeakSet<object>): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stableJsonValue(item, seen));
  }
  if (isRecord(value)) {
    if (seen.has(value)) {
      throw new ProgressValidationError("Cannot fingerprint cyclic progress data");
    }
    seen.add(value);
    const normalized = Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableJsonValue(value[key], seen)]),
    );
    seen.delete(value);
    return normalized;
  }
  return value;
}

function hashFingerprint(value: string) {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ code, 0x85ebca6b);
  }

  return `${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0)
    .toString(16)
    .padStart(8, "0")}`;
}

export function createLegacyImportFingerprint(
  aggregate: unknown,
  detailedByStorageKey: Readonly<Record<string, unknown>>,
) {
  const relevantDetails = Object.fromEntries(
    FOUNDATION_PROGRESS_MANIFEST.map((lesson) => {
      const key = getLessonStorageKey(lesson.slug, lesson.lessonVersion);
      return [key, detailedByStorageKey[key] ?? null];
    }),
  );
  const stable = stableJsonValue(
    {
      aggregateStorageKey: LEGACY_COURSE_STORAGE_KEY,
      aggregate,
      detailedByStorageKey: relevantDetails,
    },
    new WeakSet(),
  );
  return `legacy-v1-${hashFingerprint(JSON.stringify(stable))}`;
}

export const legacyFoundationCourseStorageKey = LEGACY_COURSE_STORAGE_KEY;
