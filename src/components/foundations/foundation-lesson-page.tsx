"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  GuidedLessonFlow,
  type GuidedLessonStep,
} from "@/components/guided-lesson-flow";
import { useFoundationLessonState } from "@/components/foundations/lesson-state";
import {
  FOUNDATION_PUBLISHED_LESSONS,
  getFoundationLessonSlot,
} from "@/data/foundations-level1";

function LessonLockedFallback({
  lessonNumber,
  levelLabel,
  reason,
}: {
  lessonNumber: number;
  levelLabel: string;
  reason: string;
}) {
  return (
    <main id="main-content" className="lesson-main guided-lesson-main">
      <section className="shell">
        <div className="lesson-locked-view">
          <p className="eyebrow">{levelLabel} lesson lock</p>
          <h1>{levelLabel} · Lesson {lessonNumber} is locked</h1>
          <p>
            {reason}
          </p>
          <Link className="button button-primary" href="/courses/foundations">
            Return to Developer Foundations map
          </Link>
        </div>
      </section>
    </main>
  );
}

type FoundationLessonPageProps = {
  lessonSlug: string;
  lessonNumber: number;
  lessonTitle: string;
  levelTitle: string;
  totalLessons: number;
  courseLessonNumber?: number;
  courseTotalLessons?: number;
  lessonVersion?: number;
  estimatedMinutes: number;
  steps: GuidedLessonStep[];
  children: ReactNode;
};

export function FoundationLessonPage({
  lessonSlug,
  lessonNumber,
  lessonTitle,
  levelTitle,
  totalLessons,
  estimatedMinutes,
  courseLessonNumber,
  courseTotalLessons,
  lessonVersion = 1,
  steps,
  children,
}: FoundationLessonPageProps) {
  const { isUnlocked, isCompleted } = useFoundationLessonState(lessonSlug);
  const lessonSlot = getFoundationLessonSlot(lessonSlug);
  const previousPublishedLesson = lessonSlot?.courseNumber
    ? FOUNDATION_PUBLISHED_LESSONS[lessonSlot.courseNumber - 2]
    : null;
  const requiredLessonLabel = previousPublishedLesson
    ? `Complete "${previousPublishedLesson.title}" to unlock this lesson.`
    : `Start with "${FOUNDATION_PUBLISHED_LESSONS[0]?.title ?? "What code actually is"}" to unlock this lesson.`;

  if (!isUnlocked) {
    return (
      <LessonLockedFallback
        lessonNumber={lessonNumber}
        levelLabel={levelTitle}
        reason={requiredLessonLabel}
      />
    );
  }

  const completionDescription = isCompleted
    ? "Great. This lesson is complete. Revisit this route for refreshers or move to your next lesson from the course map."
    : "You complete each checkpoint by making one real change, reading feedback, and proving the fix."
;

  return (
    <GuidedLessonFlow
      lessonId={lessonSlug}
      lessonVersion={lessonVersion}
      courseHref="/courses/foundations"
      courseName="Developer Foundations"
      levelLabel={levelTitle}
      lessonNumber={lessonNumber}
      totalLessons={totalLessons}
      courseLessonNumber={courseLessonNumber}
      courseTotalLessons={courseTotalLessons}
      title={lessonTitle}
      estimatedMinutes={estimatedMinutes}
      steps={steps}
      stepNoun="Checkpoint"
      progressLabel="Lesson progress"
      completionDescription={completionDescription}
      completionTitle="Lesson complete"
      completionEyebrow={`${levelTitle} checkpoint`}
      completionReward="Foundation path unlocked"
      courseSlug="foundations"
      lessonProgressSlug={lessonSlug}
      finalButtonLabel="Complete lesson"
    >
      {children}
    </GuidedLessonFlow>
  );
}
