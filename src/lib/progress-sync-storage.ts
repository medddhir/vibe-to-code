import {
  getCourseStorageKey,
  readStoredCourseProgressSnapshot,
  replaceStoredCourseProgressSnapshot,
} from "@/lib/course-progress";
import {
  getLessonStorageKey,
  readLessonProgressSnapshot,
  writeLessonProgressSnapshot,
} from "@/lib/lesson-progress-storage";
import {
  FOUNDATION_PROGRESS_MANIFEST,
  getFoundationKnownProgressIds,
} from "@/lib/progress-manifest";
import {
  getCanonicalProgressStorageKey,
  legacyFoundationCourseStorageKey,
  parseCanonicalFoundationProgress,
  type CanonicalFoundationProgress,
  type ProgressCounterComponents,
} from "@/lib/progress-sync";

const DEVICE_ID_STORAGE_KEY = "vibe-to-code:progress:v2:device-id";
const DEVICE_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

type ProgressStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem" | "key" | "length"
>;

export type CollectedLegacyFoundationProgress = {
  aggregate: string | null;
  detailedByStorageKey: Record<string, string | null>;
};

export type ProjectedLegacyFoundationProgress = {
  aggregateStorageKey: string;
  aggregateSerialized: string;
  detailedByStorageKey: Record<string, string>;
};

const inMemoryCanonicalCache = new Map<string, string>();
let inMemoryDeviceId: string | null = null;

function resolveStorage(storage?: ProgressStorage) {
  if (storage) return storage;

  try {
    return typeof window === "undefined" ? null : globalThis.localStorage;
  } catch {
    return null;
  }
}

function safeGetItem(storage: ProgressStorage | null, key: string) {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function flattenCounters(
  counters: Record<string, ProgressCounterComponents>,
  knownIds: readonly string[],
  deviceId: string,
) {
  return Object.fromEntries(
    knownIds
      .map(
        (progressId) =>
          [progressId, counters[progressId]?.[deviceId] ?? 0] as const,
      )
      .filter(([, total]) => total > 0),
  );
}

export function collectLegacyFoundationProgressFromStorage(
  storage?: ProgressStorage,
): CollectedLegacyFoundationProgress {
  const resolvedStorage = resolveStorage(storage);
  const aggregate = storage
    ? safeGetItem(resolvedStorage, legacyFoundationCourseStorageKey)
    : readStoredCourseProgressSnapshot("foundations") || null;
  const detailedByStorageKey = Object.fromEntries(
    FOUNDATION_PROGRESS_MANIFEST.map((lesson) => {
      const key = getLessonStorageKey(lesson.slug, lesson.lessonVersion);
      const value = storage
        ? safeGetItem(resolvedStorage, key)
        : readLessonProgressSnapshot(key) || null;
      return [key, value];
    }),
  );

  return { aggregate, detailedByStorageKey };
}

export function projectCanonicalFoundationProgressToLegacyStores(
  input: unknown,
  deviceId: string,
): ProjectedLegacyFoundationProgress {
  if (!isValidProgressDeviceId(deviceId)) {
    throw new Error("A valid opaque device ID is required to project progress safely");
  }
  const canonical = parseCanonicalFoundationProgress(input);
  const aggregateLessons: Record<string, unknown> = {};
  const detailedByStorageKey: Record<string, string> = {};

  for (const manifestLesson of FOUNDATION_PROGRESS_MANIFEST) {
    const lesson = canonical.lessons[manifestLesson.slug];
    const version = lesson.versions[String(manifestLesson.lessonVersion)];
    const knownIds = getFoundationKnownProgressIds(manifestLesson.slug);
    const completedSteps = manifestLesson.stepIds.filter(
      (progressId) => Boolean(version.completedStepsAt[progressId]),
    );
    const completedActivities = knownIds.filter(
      (progressId) => Boolean(version.completedActivitiesAt[progressId]),
    );
    const currentStepId = version.currentStep?.value ?? manifestLesson.stepIds[0];
    // Existing v1 stores have one counter per progress ID. Hydrate only this
    // device's component so a later v1 import cannot re-count remote devices.
    const attemptsByStep = flattenCounters(version.attempts, knownIds, deviceId);
    const stepHints = flattenCounters(version.hints, knownIds, deviceId);
    const savedCodeByStep = Object.fromEntries(
      knownIds.flatMap((progressId) => {
        const draft = version.savedCode[progressId];
        return draft && draft.value !== null ? [[progressId, draft.value]] : [];
      }),
    );

    aggregateLessons[manifestLesson.slug] = {
      completedAt: lesson.completedAt,
      currentCheckpoint: version.currentStep?.value ?? null,
      completedCheckpointIds: completedActivities,
      stepAttempts: attemptsByStep,
      stepHints,
    };

    const detailKey = getLessonStorageKey(
      manifestLesson.slug,
      manifestLesson.lessonVersion,
    );
    detailedByStorageKey[detailKey] = JSON.stringify({
      version: 1,
      lessonVersion: manifestLesson.lessonVersion,
      currentStepId,
      completedStepIds: completedSteps,
      practiceCompletedIds: completedActivities,
      attemptsByStep,
      savedCodeByStep,
      completedAt: lesson.completedAt,
    });
  }

  return {
    aggregateStorageKey: getCourseStorageKey("foundations"),
    aggregateSerialized: JSON.stringify({
      version: 1,
      courseVersion: canonical.curriculumVersion,
      legacyLevel1Access: canonical.legacyLevel1Access,
      lastVisitedLesson: canonical.lastVisited?.value ?? null,
      lessonOrder: FOUNDATION_PROGRESS_MANIFEST.map((lesson) => lesson.slug),
      lessons: aggregateLessons,
      updatedAt: canonical.updatedAt,
    }),
    detailedByStorageKey,
  };
}

export function applyCanonicalFoundationProgressToLegacyStores(
  input: unknown,
  options: {
    storage?: ProgressStorage;
    deviceId?: string;
  } = {},
) {
  const deviceId =
    options.deviceId ??
    getOrCreateProgressDeviceId({ storage: options.storage });
  const projected = projectCanonicalFoundationProgressToLegacyStores(
    input,
    deviceId,
  );

  if (!options.storage) {
    replaceStoredCourseProgressSnapshot(
      "foundations",
      projected.aggregateSerialized,
    );
    for (const [storageKey, serialized] of Object.entries(
      projected.detailedByStorageKey,
    )) {
      writeLessonProgressSnapshot(storageKey, serialized);
    }
    return true;
  }

  try {
    options.storage.setItem(
      projected.aggregateStorageKey,
      projected.aggregateSerialized,
    );
    for (const [storageKey, serialized] of Object.entries(
      projected.detailedByStorageKey,
    )) {
      options.storage.setItem(storageKey, serialized);
    }
    return true;
  } catch {
    return false;
  }
}

export function readCanonicalProgressCache(
  internalUserId?: string | null,
  storage?: ProgressStorage,
) {
  const storageKey = getCanonicalProgressStorageKey(internalUserId);
  const candidates = [
    safeGetItem(resolveStorage(storage), storageKey),
    inMemoryCanonicalCache.get(storageKey) ?? null,
  ];

  for (const serialized of new Set(candidates)) {
    if (!serialized) continue;
    try {
      return parseCanonicalFoundationProgress(JSON.parse(serialized));
    } catch {
      // Try the in-memory copy if persistent storage was corrupted.
    }
  }

  return null;
}

export function writeCanonicalProgressCache(
  internalUserId: string | null | undefined,
  input: unknown,
  storage?: ProgressStorage,
) {
  const canonical = parseCanonicalFoundationProgress(input);
  const storageKey = getCanonicalProgressStorageKey(internalUserId);
  const serialized = JSON.stringify(canonical);
  inMemoryCanonicalCache.set(storageKey, serialized);

  const resolvedStorage = resolveStorage(storage);
  if (!resolvedStorage) return false;

  try {
    resolvedStorage.setItem(storageKey, serialized);
    return true;
  } catch {
    return false;
  }
}

export function clearCanonicalProgressCache(
  internalUserId?: string | null,
  storage?: ProgressStorage,
) {
  const storageKey = getCanonicalProgressStorageKey(internalUserId);
  inMemoryCanonicalCache.delete(storageKey);

  const resolvedStorage = resolveStorage(storage);
  if (!resolvedStorage) return;
  try {
    resolvedStorage.removeItem(storageKey);
  } catch {
    // A blocked storage API must not make sign-out or account switching fail.
  }
}

export function isValidProgressDeviceId(value: unknown): value is string {
  return typeof value === "string" && DEVICE_ID_PATTERN.test(value);
}

function createOpaqueDeviceId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
      .slice(6, 8)
      .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
  }

  throw new Error("Secure randomness is unavailable for the progress device ID");
}

export function getOrCreateProgressDeviceId(
  options: {
    storage?: ProgressStorage;
    createId?: () => string;
  } = {},
) {
  const resolvedStorage = resolveStorage(options.storage);
  const stored = safeGetItem(resolvedStorage, DEVICE_ID_STORAGE_KEY);
  if (isValidProgressDeviceId(stored)) {
    inMemoryDeviceId = stored;
    return stored;
  }
  if (isValidProgressDeviceId(inMemoryDeviceId)) {
    return inMemoryDeviceId;
  }

  const created = (options.createId ?? createOpaqueDeviceId)();
  if (!isValidProgressDeviceId(created)) {
    throw new Error("Progress device ID generator returned an invalid opaque ID");
  }
  inMemoryDeviceId = created;

  if (resolvedStorage) {
    try {
      resolvedStorage.setItem(DEVICE_ID_STORAGE_KEY, created);
    } catch {
      // The in-memory value keeps this browser session consistent.
    }
  }
  return created;
}

export const progressDeviceIdStorageKey = DEVICE_ID_STORAGE_KEY;
export type { CanonicalFoundationProgress };
