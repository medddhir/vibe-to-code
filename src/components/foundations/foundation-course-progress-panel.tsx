"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";

import { useCurriculumReviewMode } from "@/components/environment-provider";
import { useProgressSync } from "@/components/progress/progress-sync-provider";
import type { CourseLevel } from "@/data/curriculum";
import {
  FOUNDATION_PUBLISHED_BY_SLUG,
  FOUNDATION_PUBLISHED_TOTAL_LESSONS,
  getFoundationLessonSlot,
} from "@/data/foundations-level1";
import {
  foundationPublishedOrder,
  getCourseProgressSnapshot,
  getCourseStorageKey,
  isLessonUnlockedInSnapshot,
  subscribeToCourseProgress,
  type CourseProgressSnapshot,
  type LessonProgressStatus,
} from "@/lib/course-progress";

type FoundationCourseProgressPanelProps = {
  levels: CourseLevel[];
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
  curriculumReview: boolean,
): LessonRowState["state"] {
  const progress = snapshot.lessons[lessonSlug];

  if (!progress) {
    return "locked";
  }

  if (progress.completed) {
    return "completed";
  }

  if (
    !curriculumReview &&
    !isLessonUnlockedInSnapshot(snapshot, lessonSlug)
  ) {
    return "locked";
  }

  return snapshot.lastVisitedLesson === lessonSlug ? "current" : "unlocked";
}

function subscribe(callback: () => void) {
  return subscribeToCourseProgress(getCourseStorageKey("foundations"), callback);
}

export function FoundationCourseProgressPanel({ levels }: FoundationCourseProgressPanelProps) {
  const curriculumReview = useCurriculumReviewMode();
  const progressSync = useProgressSync();
  const [resetFeedback, setResetFeedback] = useState<{
    message: string;
    ok: boolean;
  } | null>(null);
  const snapshot = useSyncExternalStore(
    subscribe,
    readCourseSnapshot,
    readServerCourseSnapshot,
  );

  const levelRows = useMemo(
    () =>
      levels.map((level) => {
        const rows = level.lessons.map((lesson) => {
          const slug = lesson.slug;
          const row: LessonRowState = {
            state: "locked",
            progress: slug ? snapshot.lessons[slug] ?? null : null,
          };

          if (slug) {
            row.state = getLessonRowState(
              snapshot,
              slug,
              curriculumReview,
            );
          }

          return { lesson, row };
        });
        const completedCount = rows.filter(({ row }) => row.state === "completed").length;

        return {
          level,
          rows,
          completedCount,
          percent: rows.length ? Math.round((completedCount / rows.length) * 100) : 0,
        };
      }),
    [curriculumReview, levels, snapshot],
  );

  const nextLessonSlug = snapshot.lessonOrder.find(
    (slug) =>
      !snapshot.lessons[slug]?.completed &&
      isLessonUnlockedInSnapshot(snapshot, slug),
  );
  const nextLesson = nextLessonSlug
    ? getFoundationLessonSlot(nextLessonSlug)
    : null;
  const hasStarted = snapshot.completedLessons.length > 0 || Boolean(snapshot.lastVisitedLesson);
  const nextActionLabel = snapshot.coursePercent === 100
    ? "Review the learning path"
    : hasStarted
      ? "Continue your course"
      : "Start Level 0";

  async function clearCourse() {
    if (
      !window.confirm(
        "Reset all published Foundation progress? You will need to complete Level 0 and Level 1 again.",
      )
    ) {
      return;
    }

    setResetFeedback(null);
    setResetFeedback(await progressSync.resetCourse());
  }

  async function clearLesson(slug?: string) {
    if (!slug) {
      return;
    }

    if (!window.confirm("Reset this lesson and keep your other Foundation progress?")) {
      return;
    }

    setResetFeedback(null);
    setResetFeedback(await progressSync.resetLesson(slug));
  }

  return (
    <section className="foundation-progress-panel" aria-labelledby="foundation-progress-title">
      <div className="foundation-progress-panel-header">
        <div>
          <p className="eyebrow">Developer Foundations · Level 0 + Level 1</p>
          <h2 id="foundation-progress-title">Your published learning path</h2>
          <p>
            {snapshot.completedLessons.length} of {FOUNDATION_PUBLISHED_TOTAL_LESSONS} published lessons completed.
          </p>
        </div>
        <Link
          className="button button-primary foundation-progress-continue"
          href={nextLesson
            ? `/lessons/${nextLesson.lesson.slug}`
            : snapshot.coursePercent === 100
              ? "/courses/foundations#course-levels"
              : "/lessons/what-is-code"}
        >
          <span>
            <small>{nextLesson ? `${nextLesson.levelLabel} · Lesson ${nextLesson.number}` : "Path complete"}</small>
            {nextActionLabel}
          </span>
          <svg className="button-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" />
          </svg>
        </Link>
      </div>

      <div className="foundation-progress-bar" aria-hidden="true">
        <span style={{ width: `${snapshot.coursePercent}%` }} />
      </div>
      <p className="foundation-progress-text">{snapshot.coursePercent}% of the published path complete</p>

      {curriculumReview ? (
        <p className="foundation-review-note">
          Staging review mode is active. Every published lesson is open for inspection;
          production will keep the guided unlock sequence.
        </p>
      ) : null}

      <div className="foundation-progress-groups">
        {levelRows.map(({ level, rows, completedCount, percent }) => (
          <section className="foundation-progress-group" key={level.label}>
            <div className="foundation-progress-group-heading">
              <div>
                <span>{level.label}</span>
                <h3>{level.title}</h3>
              </div>
              <strong>{completedCount}/{rows.length} · {percent}%</strong>
            </div>

            <ol className="foundation-progress-list">
              {rows.map(({ lesson, row }) => {
                const lessonSlug = lesson.slug;
                const slot = lessonSlug ? FOUNDATION_PUBLISHED_BY_SLUG[lessonSlug] : null;
                const isEnabled = row.state !== "locked";
                const hasActivity = Boolean(
                  row.progress &&
                  (row.progress.completed ||
                    row.progress.currentCheckpoint ||
                    row.progress.completedCheckpointCount ||
                    row.progress.totalAttempts ||
                    row.progress.totalHints),
                );

                return (
                  <li
                    key={`${level.label}-${lesson.title}`}
                    className={`foundation-progress-item state-${row.state}`}
                  >
                    <div className="foundation-progress-item-copy">
                      <span className="foundation-lesson-number">{slot?.number ?? "?"}</span>
                      <div>
                        {isEnabled && lessonSlug ? (
                          <Link className="foundation-lesson-link" href={`/lessons/${lessonSlug}`}>
                            {lesson.title}
                          </Link>
                        ) : (
                          <span className="foundation-lesson-locked">{lesson.title}</span>
                        )}
                        <small>
                          Course lesson {slot?.courseNumber ?? "?"} · {row.state === "completed"
                            ? "Completed"
                            : row.state === "current"
                              ? "Current"
                              : row.state === "unlocked"
                                ? "Unlocked"
                                : "Locked"}
                          {row.progress?.totalAttempts
                            ? ` · ${row.progress.totalAttempts} attempt(s)`
                            : ""}
                        </small>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="button button-small"
                      onClick={() => void clearLesson(lessonSlug)}
                      disabled={!hasActivity || progressSync.resettingScope !== null}
                    >
                      {lessonSlug && progressSync.resettingScope === `lesson:${lessonSlug}`
                        ? "Resetting..."
                        : "Reset"}
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>

      {snapshot.legacyLevel1Access ? (
        <p className="foundation-progress-migration-note">
          Your earlier Level 1 access is preserved while you complete the new Level 0 path.
        </p>
      ) : null}

      {resetFeedback ? (
        <p
          className="foundation-progress-text"
          role={resetFeedback.ok ? "status" : "alert"}
        >
          {resetFeedback.message}
        </p>
      ) : null}

      <button
        type="button"
        className="button button-secondary"
        onClick={() => void clearCourse()}
        disabled={progressSync.resettingScope !== null}
      >
        {progressSync.resettingScope === "course"
          ? "Resetting Foundation progress..."
          : "Reset published Foundation progress"}
      </button>
    </section>
  );
}
