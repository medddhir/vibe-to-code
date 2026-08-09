"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

import {
  getCourseProgressSnapshot,
  getCourseStorageKey,
  resetCourseProgress,
  resetLessonProgress,
  type CourseProgressSnapshot,
  type LessonProgressStatus,
  subscribeToCourseProgress,
  foundationLevel1Order,
} from "@/lib/course-progress";
import type { Lesson as CourseLesson } from "@/data/curriculum";
import { FOUNDATION_LEVEL1_BY_SLUG } from "@/data/foundations-level1";
import { foundationLevels } from "@/data/course-content";

type FoundationCourseProgressPanelProps = {
  lessons: CourseLesson[];
};

type LessonRowState = {
  state: "locked" | "unlocked" | "current" | "completed";
  progress: LessonProgressStatus | null;
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

function readCourseSnapshot() {
  const nextSnapshot = getCourseProgressSnapshot("foundations");
  const nextFingerprint = JSON.stringify(nextSnapshot);

  if (nextFingerprint !== cachedCourseFingerprint) {
    cachedCourseSnapshot = nextSnapshot;
    cachedCourseFingerprint = nextFingerprint;
  }

  return cachedCourseSnapshot;
}

function readServerCourseSnapshot() {
  return EMPTY_COURSE_SNAPSHOT;
}

function getLessonRowState(
  snapshot: CourseProgressSnapshot,
  lessonSlug: string,
): LessonRowState["state"] {
  const progress = snapshot.lessons[lessonSlug];

  if (!progress) {
    return "locked";
  }

  if (progress.completed) {
    return "completed";
  }

  const lessonIndex = snapshot.lessonOrder.indexOf(lessonSlug);
  if (lessonIndex < 0) {
    return "locked";
  }

  if (
    lessonIndex > 0 &&
    !snapshot.lessons[snapshot.lessonOrder[lessonIndex - 1]]?.completed
  ) {
    return "locked";
  }

  return snapshot.lastVisitedLesson === lessonSlug ? "current" : "unlocked";
}

function subscribe(callback: () => void) {
  return subscribeToCourseProgress(getCourseStorageKey("foundations"), callback);
}

export function FoundationCourseProgressPanel({ lessons }: FoundationCourseProgressPanelProps) {
  const snapshot = useSyncExternalStore(
    subscribe,
    readCourseSnapshot,
    readServerCourseSnapshot,
  );
  const lessonRows = useMemo(() => {
    return lessons.map((lesson) => {
      const slug = lesson.slug;
      const row: LessonRowState = {
        state: "locked",
        progress: slug ? snapshot.lessons[slug] ?? null : null,
      };

      if (slug) {
        row.state = getLessonRowState(snapshot, slug);
      }

      return { lesson, row };
    });
  }, [lessons, snapshot]);

  const levelOneLessonCount = foundationLevels[1]?.lessons.length ?? 0;

  const lessonTitleMap = useMemo(() => {
    return lessons.reduce<Record<string, number>>((acc, lesson) => {
      const lessonSlug = lesson.slug;
      if (!lessonSlug) {
        return acc;
      }

      acc[lessonSlug] = FOUNDATION_LEVEL1_BY_SLUG[lessonSlug]?.number ?? 0;
      return acc;
    }, {});
  }, [lessons]);

  function clearCourse() {
    if (
      !window.confirm(
        "Reset all Level 1 progress? You will need to complete all lessons again from Lesson 1.",
      )
    ) {
      return;
    }

    resetCourseProgress("foundations");
  }

  function clearLesson(slug?: string) {
    if (!slug) {
      return;
    }

    if (!window.confirm("Reset this lesson and keep your other Level 1 lesson progress?")) {
      return;
    }

    resetLessonProgress("foundations", slug);
  }

  return (
    <section className="foundation-progress-panel" aria-labelledby="foundation-level1-progress-title">
      <div className="foundation-progress-panel-header">
        <div>
          <p className="eyebrow">Developer Foundations · Level 1</p>
          <h2 id="foundation-level1-progress-title">Progress tracker</h2>
          <p>
            {snapshot.completedLessons.length} of {levelOneLessonCount} lessons completed.
          </p>
        </div>
      </div>

      <div className="foundation-progress-bar" aria-hidden="true">
        <span style={{ width: `${snapshot.coursePercent}%` }} />
      </div>
      <p className="foundation-progress-text">{snapshot.coursePercent}% Course completion</p>

      <ol className="foundation-progress-list" start={1}>
        {lessonRows.map(({ lesson, row }) => {
          const lessonSlug = lesson.slug;
          const lessonNumber = lessonSlug ? lessonTitleMap[lessonSlug] : 0;
          const isEnabled = row.state !== "locked";

          return (
            <li
              key={`${lesson.title}-${lesson.slug ?? lesson.duration}`}
              className={`foundation-progress-item state-${row.state}`}
            >
              <div className="foundation-progress-item-copy">
                <span className="foundation-lesson-number">{lessonNumber || "?"}</span>
                <div>
                  {isEnabled && lessonSlug ? (
                    <Link className="foundation-lesson-link" href={`/lessons/${lessonSlug}`}>
                      {lesson.title}
                    </Link>
                  ) : (
                    <span className="foundation-lesson-locked">Locked</span>
                  )}
                  <small>
                    {row.state === "completed"
                      ? "Completed"
                      : row.state === "current"
                        ? "Current"
                        : row.state === "unlocked"
                          ? "Unlocked"
                          : "Locked"}
                    {row.progress?.totalAttempts ? ` · ${row.progress.totalAttempts} attempt(s)` : ""}
                  </small>
                </div>
              </div>

              <button
                type="button"
                className="button button-small"
                onClick={() => clearLesson(lessonSlug)}
              >
                Reset
              </button>
            </li>
          );
        })}
      </ol>

      <button type="button" className="button button-secondary" onClick={clearCourse}>
        Reset Level 1 progress
      </button>
    </section>
  );
}
