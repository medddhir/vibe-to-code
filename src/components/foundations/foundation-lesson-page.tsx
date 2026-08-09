"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  GuidedLessonFlow,
  type GuidedLessonStep,
} from "@/components/guided-lesson-flow";
import { useFoundationLessonState } from "@/components/foundations/lesson-state";

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

  if (!isUnlocked) {
    return (
      <LessonLockedFallback
        lessonNumber={lessonNumber}
        title={lessonTitle}
        reason="Complete Lesson 1 of this level first so you can move in sequence safely."
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
