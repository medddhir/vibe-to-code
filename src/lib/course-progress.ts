import { foundationLevels } from "@/data/course-content";
import {
  clearStoredLessonProgress,
  clearStoredLessonProgressForLessons,
} from "@/lib/lesson-progress-storage";
import { FOUNDATION_CURRICULUM_VERSION } from "@/lib/progress-manifest";

type LessonProgressRecord = {
  completedAt: string | null;
  currentCheckpoint: string | null;
  completedCheckpointIds: string[];
  stepAttempts: Record<string, number>;
  stepHints: Record<string, number>;
};

export type LessonProgressStatus = {
  completed: boolean;
  currentCheckpoint: string | null;
  completedCheckpointCount: number;
  totalAttempts: number;
  totalHints: number;
};

type CourseProgressRecord = {
  version: 1;
  courseVersion: number;
  legacyLevel1Access: boolean;
  lastVisitedLesson: string | null;
  lessonOrder: string[];
  lessons: Record<string, LessonProgressRecord>;
  updatedAt: string;
};

export type CourseProgressSnapshot = {
  version: number;
  courseVersion: number;
  legacyLevel1Access: boolean;
  lastVisitedLesson: string | null;
  lessonOrder: string[];
  lessons: Record<string, LessonProgressStatus>;
  completedLessons: string[];
  coursePercent: number;
};

export type LessonUnlockState = "locked" | "unlocked" | "current" | "completed";

const COURSE_PROGRESS_EVENT = "vibe-to-code:course-progress";
const COURSE_PROGRESS_VERSION = 1;
const FOUNDATION_COURSE_VERSION = FOUNDATION_CURRICULUM_VERSION;
const STORAGE_PREFIX = "vibe-to-code:course-progress:v1";

const inMemoryCourseProgress = new Map<string, string>();
const memoryOnlyCourses = new Set<string>();

const FOUNDATION_LEVEL0_ORDER = foundationLevels[0]?.lessons
  ?.map((lesson) => lesson.slug)
  .filter((slug): slug is string => typeof slug === "string") ?? [];

const FOUNDATION_LEVEL1_ORDER = foundationLevels[1]?.lessons
  ?.map((lesson) => lesson.slug)
  .filter((slug): slug is string => typeof slug === "string") ?? [];

const FOUNDATION_PUBLISHED_ORDER = [
  ...FOUNDATION_LEVEL0_ORDER,
  ...FOUNDATION_LEVEL1_ORDER,
];

function getFoundationLessonOrder() {
  return [...FOUNDATION_PUBLISHED_ORDER];
}

function makeEmptyLessonRecord(): LessonProgressRecord {
  return {
    completedAt: null,
    currentCheckpoint: null,
    completedCheckpointIds: [],
    stepAttempts: {},
    stepHints: {},
  };
}

function createDefaultCourseRecord(courseSlug: string): CourseProgressRecord {
  const lessonOrder =
    courseSlug === "foundations" ? getFoundationLessonOrder() : [];

  return {
    version: COURSE_PROGRESS_VERSION,
    courseVersion: FOUNDATION_COURSE_VERSION,
    legacyLevel1Access: false,
    lastVisitedLesson: null,
    lessonOrder,
    lessons: lessonOrder.reduce<Record<string, LessonProgressRecord>>((acc, lessonSlug) => {
      acc[lessonSlug] = makeEmptyLessonRecord();
      return acc;
    }, {}),
    updatedAt: new Date().toISOString(),
  };
}

function createProgressSnapshot(raw: CourseProgressRecord): CourseProgressSnapshot {
  const lessonEntries = Object.entries(raw.lessons);
  const lessonOrder = raw.lessonOrder;
  const lessonStatuses = lessonEntries.reduce<Record<string, LessonProgressStatus>>(
    (acc, [slug, lesson]) => {
      const attempts = Object.values(lesson.stepAttempts).reduce((sum, value) => sum + value, 0);
      const hints = Object.values(lesson.stepHints).reduce((sum, value) => sum + value, 0);

      acc[slug] = {
        completed: Boolean(lesson.completedAt),
        currentCheckpoint: lesson.currentCheckpoint,
        completedCheckpointCount: lesson.completedCheckpointIds.length,
        totalAttempts: attempts,
        totalHints: hints,
      };

      return acc;
    },
    {},
  );

  const completedLessons = lessonOrder.filter((slug) => lessonStatuses[slug]?.completed);

  return {
    version: raw.version,
    courseVersion: raw.courseVersion,
    legacyLevel1Access: raw.legacyLevel1Access,
    lastVisitedLesson: raw.lastVisitedLesson,
    lessonOrder,
    lessons: lessonStatuses,
    completedLessons,
    coursePercent: lessonOrder.length
      ? Math.round((completedLessons.length / lessonOrder.length) * 100)
      : 0,
  };
}

function getStorageKey(courseSlug: string) {
  return `${STORAGE_PREFIX}:${courseSlug}`;
}

function readProgressSnapshot(storageKey: string) {
  if (typeof window === "undefined") {
    return "";
  }

  if (memoryOnlyCourses.has(storageKey)) {
    return inMemoryCourseProgress.get(storageKey) ?? "";
  }

  try {
    return localStorage.getItem(storageKey) ?? inMemoryCourseProgress.get(storageKey) ?? "";
  } catch {
    memoryOnlyCourses.add(storageKey);
    return inMemoryCourseProgress.get(storageKey) ?? "";
  }
}

function writeProgressSnapshot(storageKey: string, value: string) {
  inMemoryCourseProgress.set(storageKey, value);

  try {
    localStorage.setItem(storageKey, value);
  } catch {
    memoryOnlyCourses.add(storageKey);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(COURSE_PROGRESS_EVENT, { detail: { storageKey } }),
    );
  }
}

function normalizeCourseRecord(raw: string | null, courseSlug: string): CourseProgressRecord {
  const fallback = createDefaultCourseRecord(courseSlug);

  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CourseProgressRecord>;

    if (
      parsed.version !== COURSE_PROGRESS_VERSION ||
      (parsed.courseVersion !== 1 && parsed.courseVersion !== FOUNDATION_COURSE_VERSION)
    ) {
      return fallback;
    }

    const lessonOrder = createDefaultCourseRecord(courseSlug).lessonOrder;

    const lessons = lessonOrder.reduce<Record<string, LessonProgressRecord>>(
      (acc, slug) => {
        const saved = parsed.lessons?.[slug];

        if (!saved || typeof saved !== "object") {
          acc[slug] = makeEmptyLessonRecord();
          return acc;
        }

        acc[slug] = {
          completedAt:
            typeof saved.completedAt === "string" ? saved.completedAt : null,
          currentCheckpoint:
            typeof saved.currentCheckpoint === "string" ? saved.currentCheckpoint : null,
          completedCheckpointIds: Array.isArray(saved.completedCheckpointIds)
            ? saved.completedCheckpointIds.filter((id): id is string => typeof id === "string")
            : [],
          stepAttempts:
            typeof saved.stepAttempts === "object" && saved.stepAttempts !== null
              ? Object.fromEntries(
                  Object.entries(saved.stepAttempts)
                    .filter(([id, value]) => id && typeof value === "number" && value >= 0)
                    .map(([id, value]) => [id, value]),
                )
              : {},
          stepHints:
            typeof saved.stepHints === "object" && saved.stepHints !== null
              ? Object.fromEntries(
                  Object.entries(saved.stepHints)
                    .filter(([id, value]) => id && typeof value === "number" && value >= 0)
                    .map(([id, value]) => [id, value]),
                )
              : {},
        };

        return acc;
      },
      {},
    );

    const hadLegacyLevel1Activity =
      parsed.courseVersion === 1 &&
      (FOUNDATION_LEVEL1_ORDER.some((slug) => {
        const lesson = parsed.lessons?.[slug];
        return Boolean(
          lesson?.completedAt ||
            lesson?.currentCheckpoint ||
            lesson?.completedCheckpointIds?.length ||
            Object.keys(lesson?.stepAttempts ?? {}).length ||
            Object.keys(lesson?.stepHints ?? {}).length,
        );
      }) ||
        (typeof parsed.lastVisitedLesson === "string" &&
          FOUNDATION_LEVEL1_ORDER.includes(parsed.lastVisitedLesson)));

    return {
      version: COURSE_PROGRESS_VERSION,
      courseVersion: FOUNDATION_COURSE_VERSION,
      legacyLevel1Access:
        typeof parsed.legacyLevel1Access === "boolean"
          ? parsed.legacyLevel1Access
          : hadLegacyLevel1Activity,
      lastVisitedLesson:
        typeof parsed.lastVisitedLesson === "string" &&
        lessonOrder.includes(parsed.lastVisitedLesson)
          ? parsed.lastVisitedLesson
          : null,
      lessonOrder,
      lessons,
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return fallback;
  }
}

export function readCourseProgress(courseSlug: string): CourseProgressRecord {
  const storageKey = getStorageKey(courseSlug);
  const serialized = readProgressSnapshot(storageKey);
  return normalizeCourseRecord(serialized, courseSlug);
}

function updateCourseProgress(
  courseSlug: string,
  updater: (current: CourseProgressRecord) => CourseProgressRecord,
) {
  const storageKey = getStorageKey(courseSlug);
  const current = normalizeCourseRecord(readProgressSnapshot(storageKey), courseSlug);
  const next = updater(current);
  next.updatedAt = new Date().toISOString();
  writeProgressSnapshot(storageKey, JSON.stringify(next));
}

export function getLessonOrder(courseSlug: string) {
  return readCourseProgress(courseSlug).lessonOrder;
}

export function getCourseProgressSnapshot(courseSlug: string): CourseProgressSnapshot {
  return createProgressSnapshot(readCourseProgress(courseSlug));
}

export function isLessonUnlockedInSnapshot(
  snapshot: CourseProgressSnapshot,
  lessonSlug: string,
) {
  const index = snapshot.lessonOrder.indexOf(lessonSlug);

  if (index < 0) {
    return false;
  }

  if (index === 0) {
    return true;
  }

  if (
    index === FOUNDATION_LEVEL0_ORDER.length &&
    snapshot.legacyLevel1Access
  ) {
    return true;
  }

  const previous = snapshot.lessonOrder[index - 1];
  return Boolean(snapshot.lessons[previous]?.completed);
}

export function isLessonUnlocked(courseSlug: string, lessonSlug: string) {
  return isLessonUnlockedInSnapshot(
    getCourseProgressSnapshot(courseSlug),
    lessonSlug,
  );
}

export function getLessonUnlockState(courseSlug: string, lessonSlug: string): LessonUnlockState {
  const snapshot = getCourseProgressSnapshot(courseSlug);
  const lesson = snapshot.lessons[lessonSlug];

  if (!lesson) {
    return "locked";
  }

  if (lesson.completed) {
    return "completed";
  }

  if (!isLessonUnlockedInSnapshot(snapshot, lessonSlug)) {
    return "locked";
  }

  if (snapshot.lastVisitedLesson === lessonSlug) {
    return "current";
  }

  return "unlocked";
}

export function setCurrentLesson(courseSlug: string, lessonSlug: string) {
  const order = getLessonOrder(courseSlug);

  if (courseSlug !== "foundations") {
    return;
  }

  if (!order.includes(lessonSlug)) {
    return;
  }

  updateCourseProgress(courseSlug, (current) => ({
    ...current,
    lastVisitedLesson: lessonSlug,
  }));
}

export function setCurrentCheckpoint(courseSlug: string, lessonSlug: string, stepId: string) {
  if (courseSlug !== "foundations") {
    return;
  }

  if (!getFoundationLessonOrder().includes(lessonSlug)) {
    return;
  }

  updateCourseProgress(courseSlug, (current) => ({
    ...current,
    lessons: {
      ...current.lessons,
      [lessonSlug]: {
        ...makeEmptyLessonRecordFallback(current.lessons[lessonSlug]),
        ...current.lessons[lessonSlug],
        currentCheckpoint: stepId,
      },
    },
  }));
}

function makeEmptyLessonRecordFallback(record: LessonProgressRecord | undefined) {
  return record ?? makeEmptyLessonRecord();
}

export function recordLessonAttempt(courseSlug: string, lessonSlug: string, stepId: string) {
  if (courseSlug !== "foundations") {
    return;
  }

  if (!getFoundationLessonOrder().includes(lessonSlug)) {
    return;
  }

  updateCourseProgress(courseSlug, (current) => ({
    ...current,
    lessons: {
      ...current.lessons,
      [lessonSlug]: {
        ...makeEmptyLessonRecordFallback(current.lessons[lessonSlug]),
        currentCheckpoint: stepId,
        stepAttempts: {
          ...makeEmptyLessonRecordFallback(current.lessons[lessonSlug]).stepAttempts,
          [stepId]:
            (makeEmptyLessonRecordFallback(current.lessons[lessonSlug]).stepAttempts[stepId] ?? 0) + 1,
        },
      },
    },
  }));
}

export function recordLessonHint(courseSlug: string, lessonSlug: string, stepId: string) {
  if (courseSlug !== "foundations") {
    return;
  }

  if (!getFoundationLessonOrder().includes(lessonSlug)) {
    return;
  }

  updateCourseProgress(courseSlug, (current) => ({
    ...current,
    lessons: {
      ...current.lessons,
      [lessonSlug]: {
        ...makeEmptyLessonRecordFallback(current.lessons[lessonSlug]),
        currentCheckpoint: stepId,
        stepHints: {
          ...makeEmptyLessonRecordFallback(current.lessons[lessonSlug]).stepHints,
          [stepId]:
            (makeEmptyLessonRecordFallback(current.lessons[lessonSlug]).stepHints[stepId] ?? 0) + 1,
        },
      },
    },
  }));
}

export function recordCompletedCheckpoint(courseSlug: string, lessonSlug: string, stepId: string) {
  if (courseSlug !== "foundations") {
    return;
  }

  if (!getFoundationLessonOrder().includes(lessonSlug)) {
    return;
  }

  updateCourseProgress(courseSlug, (current) => {
    const existing = makeEmptyLessonRecordFallback(current.lessons[lessonSlug]);
    const completedCheckpointIds = existing.completedCheckpointIds.includes(stepId)
      ? existing.completedCheckpointIds
      : [...existing.completedCheckpointIds, stepId];

    return {
      ...current,
      lessons: {
        ...current.lessons,
        [lessonSlug]: {
          ...existing,
          currentCheckpoint: stepId,
          completedCheckpointIds,
        },
      },
    };
  });
}

export function markLessonCompleted(courseSlug: string, lessonSlug: string, stepId?: string) {
  if (courseSlug !== "foundations") {
    return;
  }

  if (!getFoundationLessonOrder().includes(lessonSlug)) {
    return;
  }

  updateCourseProgress(courseSlug, (current) => ({
    ...current,
    lessons: {
      ...current.lessons,
      [lessonSlug]: {
        ...makeEmptyLessonRecordFallback(current.lessons[lessonSlug]),
        completedAt: current.lessons[lessonSlug]?.completedAt ?? new Date().toISOString(),
        currentCheckpoint: stepId ?? null,
      },
    },
  }));
}

export function resetLessonProgress(courseSlug: string, lessonSlug: string) {
  if (courseSlug !== "foundations") {
    return;
  }

  if (!getFoundationLessonOrder().includes(lessonSlug)) {
    return;
  }

  updateCourseProgress(courseSlug, (current) => ({
    ...current,
    lessons: {
      ...current.lessons,
      [lessonSlug]: makeEmptyLessonRecord(),
    },
  }));
  clearStoredLessonProgress(lessonSlug);
}

export function resetCourseProgress(courseSlug: string) {
  if (courseSlug !== "foundations") {
    return;
  }

  const cleared = createDefaultCourseRecord(courseSlug);
  const storageKey = getStorageKey(courseSlug);
  writeProgressSnapshot(storageKey, JSON.stringify(cleared));
  clearStoredLessonProgressForLessons(getFoundationLessonOrder());
}

export function getLessonProgressState(
  courseSlug: string,
  lessonSlug: string,
): LessonProgressStatus {
  return getCourseProgressSnapshot(courseSlug).lessons[lessonSlug] ?? {
    completed: false,
    currentCheckpoint: null,
    completedCheckpointCount: 0,
    totalAttempts: 0,
    totalHints: 0,
  };
}

export function subscribeToCourseProgress(storageKey: string, callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  function handleLocalProgress(event: Event) {
    const detail = (event as CustomEvent<{ storageKey?: string }>).detail;
    if (detail?.storageKey === storageKey) {
      callback();
    }
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === storageKey) {
      callback();
    }
  }

  window.addEventListener(COURSE_PROGRESS_EVENT, handleLocalProgress);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(COURSE_PROGRESS_EVENT, handleLocalProgress);
    window.removeEventListener("storage", handleStorage);
  };
}

export function getCourseStorageKey(courseSlug: string) {
  return getStorageKey(courseSlug);
}

export function readStoredCourseProgressSnapshot(courseSlug: string) {
  return readProgressSnapshot(getStorageKey(courseSlug));
}

export function replaceStoredCourseProgressSnapshot(
  courseSlug: string,
  serializedProgress: string,
) {
  const normalized = normalizeCourseRecord(serializedProgress, courseSlug);
  writeProgressSnapshot(getStorageKey(courseSlug), JSON.stringify(normalized));
}

export const foundationLevel0Order = [...FOUNDATION_LEVEL0_ORDER];
export const foundationLevel1Order = [...FOUNDATION_LEVEL1_ORDER];
export const foundationPublishedOrder = getFoundationLessonOrder();
