"use client";

import { useMemo } from "react";
import { useSyncExternalStore } from "react";

import { useCurriculumReviewMode } from "@/components/environment-provider";
import {
  getCourseProgressSnapshot,
  getCourseStorageKey,
  type CourseProgressSnapshot,
  type LessonProgressStatus,
  isLessonUnlockedInSnapshot,
  subscribeToCourseProgress,
  foundationPublishedOrder,
} from "@/lib/course-progress";
import { FOUNDATION_CURRICULUM_VERSION } from "@/lib/progress-manifest";

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
  courseVersion: FOUNDATION_CURRICULUM_VERSION,
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

export function getFoundationServerLessonSnapshot() {
  return EMPTY_COURSE_SNAPSHOT;
}

function readServerSnapshot() {
  return getFoundationServerLessonSnapshot();
}

function subscribe(callback: () => void) {
  return subscribeToCourseProgress(getCourseStorageKey("foundations"), callback);
}

export function useFoundationLessonState(lessonSlug: string) {
  const curriculumReview = useCurriculumReviewMode();
  const snapshot = useSyncExternalStore(
    subscribe,
    readSnapshot,
    readServerSnapshot,
  );

  return useMemo<LessonAccessState>(() => {
    const lesson = snapshot.lessons[lessonSlug];

    return {
      isUnlocked:
        curriculumReview || isLessonUnlockedInSnapshot(snapshot, lessonSlug),
      isCompleted: Boolean(lesson?.completed),
      isCurrent: snapshot.lastVisitedLesson === lessonSlug,
      attempts: lesson?.totalAttempts ?? 0,
      hints: lesson?.totalHints ?? 0,
      checkpointCount: lesson?.completedCheckpointCount ?? 0,
    };
  }, [curriculumReview, lessonSlug, snapshot]);
}
