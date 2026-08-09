"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  GuidedLessonFlow,
  type GuidedLessonStep,
} from "@/components/guided-lesson-flow";
import { useFoundationLessonState } from "@/components/foundations/lesson-state";
import { FOUNDATION_LEVEL1_BY_SLUG, FOUNDATION_LEVEL1_LESSONS } from "@/data/foundations-level1";

function LessonLockedFallback({ lessonNumber, title, reason }: { lessonNumber: number; title: string; reason: string }) {
  return (
    <main id="main-content" className="lesson-main guided-lesson-main">
      <section className="shell">
        <div className="lesson-locked-view">
          <p className="eyebrow">Level 1 lesson lock</p>
          <h1>Lesson {lessonNumber} not available yet</h1>
          <p>
            <strong>{title}</strong> is locked. {reason}
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
  steps,
  children,
}: FoundationLessonPageProps) {
  const { isUnlocked, isCompleted } = useFoundationLessonState(lessonSlug);
  const levelSlot = FOUNDATION_LEVEL1_BY_SLUG[lessonSlug];
  const lessonNumberInLevel = levelSlot?.index !== undefined ? levelSlot.index + 1 : null;
  const previousLevelLesson =
    lessonNumberInLevel && lessonNumberInLevel > 1
      ? FOUNDATION_LEVEL1_LESSONS[lessonNumberInLevel - 2]
      : null;
  const requiredLevelLessonLabel =
    lessonNumberInLevel && lessonNumberInLevel > 1
      ? `Complete "${previousLevelLesson?.title ?? `Lesson ${lessonNumberInLevel - 1}`}" first so you can move in sequence safely.`
      : "Start with Lesson 1 of Developer Foundations level 1 before moving to this lesson.";

  if (!isUnlocked) {
    return (
      <LessonLockedFallback
        lessonNumber={lessonNumber}
        title={lessonTitle}
        reason={requiredLevelLessonLabel}
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
      lessonVersion={1}
      courseHref="/courses/foundations"
      courseName="Developer Foundations"
      levelLabel={levelTitle}
      lessonNumber={lessonNumber}
      totalLessons={totalLessons}
      title={lessonTitle}
      estimatedMinutes={estimatedMinutes}
      steps={steps}
      stepNoun="Checkpoint"
      progressLabel="Lesson progress"
      completionDescription={completionDescription}
      completionTitle="Lesson complete"
      completionEyebrow="Level 1 checkpoint"
      completionReward="Foundation path unlocked"
      courseSlug="foundations"
      lessonProgressSlug={lessonSlug}
      finalButtonLabel="Complete lesson"
    >
      {children}
    </GuidedLessonFlow>
  );
}
