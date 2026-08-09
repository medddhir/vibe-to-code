"use client";

import { useMemo } from "react";
import { useSyncExternalStore } from "react";

import {
  getCourseProgressSnapshot,
  getCourseStorageKey,
  type CourseProgressSnapshot,
  type LessonProgressStatus,
  isLessonUnlockedInSnapshot,
  subscribeToCourseProgress,
  foundationPublishedOrder,
} from "@/lib/course-progress";

export type LessonAccessState = {
  isUnlocked: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
  attempts: number;
  hints: number;
  checkpointCount: number;
};

const EMPTY_LESSON_PROGRESS: LessonProgressStatus = {
  completed: false,
  currentCheckpoint: null,
  completedCheckpointCount: 0,
  totalAttempts: 0,
  totalHints: 0,
};

const EMPTY_COURSE_SNAPSHOT: CourseProgressSnapshot = {
  version: 1,
  courseVersion: 2,
  legacyLevel1Access: false,
  lastVisitedLesson: null,
  lessonOrder: [...foundationPublishedOrder],
  lessons: Object.fromEntries(
    foundationPublishedOrder.map((slug) => [slug, { ...EMPTY_LESSON_PROGRESS }]),
  ),
  completedLessons: [],
  coursePercent: 0,
};

let cachedCourseSnapshot = EMPTY_COURSE_SNAPSHOT;
let cachedCourseFingerprint = JSON.stringify(EMPTY_COURSE_SNAPSHOT);

function readSnapshot() {
  const nextSnapshot = getCourseProgressSnapshot("foundations");
  const nextFingerprint = JSON.stringify(nextSnapshot);

  if (nextFingerprint !== cachedCourseFingerprint) {
    cachedCourseSnapshot = nextSnapshot;
    cachedCourseFingerprint = nextFingerprint;
  }

  return cachedCourseSnapshot;
}

function readServerSnapshot() {
  return EMPTY_COURSE_SNAPSHOT;
}

function subscribe(callback: () => void) {
  return subscribeToCourseProgress(getCourseStorageKey("foundations"), callback);
}

export function useFoundationLessonState(lessonSlug: string) {
  const snapshot = useSyncExternalStore(
    subscribe,
    readSnapshot,
    readServerSnapshot,
  );

  return useMemo<LessonAccessState>(() => {
    const lesson = snapshot.lessons[lessonSlug];

    return {
      isUnlocked: isLessonUnlockedInSnapshot(snapshot, lessonSlug),
      isCompleted: Boolean(lesson?.completed),
      isCurrent: snapshot.lastVisitedLesson === lessonSlug,
      attempts: lesson?.totalAttempts ?? 0,
      hints: lesson?.totalHints ?? 0,
      checkpointCount: lesson?.completedCheckpointCount ?? 0,
    };
  }, [lessonSlug, snapshot]);
}
