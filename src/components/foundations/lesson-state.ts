"use client";

import { useMemo } from "react";
import { useSyncExternalStore } from "react";

import {
  getCourseProgressSnapshot,
  getCourseStorageKey,
  type CourseProgressSnapshot,
  type LessonProgressStatus,
  subscribeToCourseProgress,
  foundationLevel1Order,
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
  courseVersion: 1,
  lastVisitedLesson: null,
  lessonOrder: [...foundationLevel1Order],
  lessons: Object.fromEntries(
    foundationLevel1Order.map((slug) => [slug, { ...EMPTY_LESSON_PROGRESS }]),
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

function isLessonUnlockedFromSnapshot(
  snapshot: CourseProgressSnapshot,
  lessonSlug: string,
) {
  const lessonIndex = snapshot.lessonOrder.indexOf(lessonSlug);

  if (lessonIndex < 0) {
    return false;
  }

  if (lessonIndex === 0) {
    return true;
  }

  const previousLessonSlug = snapshot.lessonOrder[lessonIndex - 1];
  return Boolean(snapshot.lessons[previousLessonSlug]?.completed);
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
      isUnlocked: isLessonUnlockedFromSnapshot(snapshot, lessonSlug),
      isCompleted: Boolean(lesson?.completed),
      isCurrent: snapshot.lastVisitedLesson === lessonSlug,
      attempts: lesson?.totalAttempts ?? 0,
      hints: lesson?.totalHints ?? 0,
      checkpointCount: lesson?.completedCheckpointCount ?? 0,
    };
  }, [lessonSlug, snapshot]);
}
