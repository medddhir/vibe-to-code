"use client";

import { useMemo } from "react";
import { useSyncExternalStore } from "react";

import {
  getCourseProgressSnapshot,
  getCourseStorageKey,
  isLessonUnlocked,
  subscribeToCourseProgress,
} from "@/lib/course-progress";

export type LessonAccessState = {
  isUnlocked: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
  attempts: number;
  hints: number;
  checkpointCount: number;
};

function readSnapshot() {
  return getCourseProgressSnapshot("foundations");
}

function subscribe(callback: () => void) {
  return subscribeToCourseProgress(getCourseStorageKey("foundations"), callback);
}

export function useFoundationLessonState(lessonSlug: string) {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, readSnapshot);

  return useMemo<LessonAccessState>(() => {
    const lesson = snapshot.lessons[lessonSlug];

    return {
      isUnlocked: isLessonUnlocked("foundations", lessonSlug),
      isCompleted: Boolean(lesson?.completed),
      isCurrent: snapshot.lastVisitedLesson === lessonSlug,
      attempts: lesson?.totalAttempts ?? 0,
      hints: lesson?.totalHints ?? 0,
      checkpointCount: lesson?.completedCheckpointCount ?? 0,
    };
  }, [lessonSlug, snapshot]);
}
