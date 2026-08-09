import { foundationLevels } from "@/data/course-content";

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
  lastVisitedLesson: string | null;
  lessonOrder: string[];
  lessons: Record<string, LessonProgressRecord>;
  updatedAt: string;
};

export type CourseProgressSnapshot = {
  version: number;
  courseVersion: number;
  lastVisitedLesson: string | null;
  lessonOrder: string[];
  lessons: Record<string, LessonProgressStatus>;
  completedLessons: string[];
  coursePercent: number;
};

export type LessonUnlockState = "locked" | "unlocked" | "current" | "completed";

const COURSE_PROGRESS_EVENT = "vibe-to-code:course-progress";
const COURSE_PROGRESS_VERSION = 1;
const STORAGE_PREFIX = "vibe-to-code:course-progress:v1";

const inMemoryCourseProgress = new Map<string, string>();
const memoryOnlyCourses = new Set<string>();

const FOUNDATION_LEVELS = foundationLevels[1]?.lessons
  ?.map((lesson) => lesson.slug)
  .filter((slug): slug is string => typeof slug === "string") ?? [];

function getFoundationLessonOrder() {
  return [...FOUNDATION_LEVELS];
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
    courseVersion: 1,
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

    if (parsed.version !== COURSE_PROGRESS_VERSION || parsed.courseVersion !== 1) {
      return fallback;
    }

    const lessonOrder = Array.isArray(parsed.lessonOrder)
      ? parsed.lessonOrder.filter((slug): slug is string => typeof slug === "string")
      : createDefaultCourseRecord(courseSlug).lessonOrder;

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

    return {
      version: COURSE_PROGRESS_VERSION,
      courseVersion: 1,
      lastVisitedLesson:
        typeof parsed.lastVisitedLesson === "string" ? parsed.lastVisitedLesson : null,
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

export function isLessonUnlocked(courseSlug: string, lessonSlug: string) {
  const progress = readCourseProgress(courseSlug);
  const order = progress.lessonOrder;
  const index = order.indexOf(lessonSlug);

  if (index < 0) {
    return false;
  }

  if (index === 0) {
    return true;
  }

  const previous = order[index - 1];
  return Boolean(progress.lessons[previous]?.completedAt);
}

export function getLessonUnlockState(courseSlug: string, lessonSlug: string): LessonUnlockState {
  const progress = readCourseProgress(courseSlug);
  const lesson = progress.lessons[lessonSlug];

  if (!lesson) {
    return "locked";
  }

  if (lesson.completedAt) {
    return "completed";
  }

  if (!isLessonUnlocked(courseSlug, lessonSlug)) {
    return "locked";
  }

  if (progress.lastVisitedLesson === lessonSlug) {
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
}

export function resetCourseProgress(courseSlug: string) {
  if (courseSlug !== "foundations") {
    return;
  }

  const cleared = createDefaultCourseRecord(courseSlug);
  const storageKey = getStorageKey(courseSlug);
  writeProgressSnapshot(storageKey, JSON.stringify(cleared));
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

export const foundationLevel1Order = getFoundationLessonOrder();
