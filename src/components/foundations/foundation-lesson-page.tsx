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
  getFoundationCourseMapHref,
  getFoundationLessonJourney,
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
  const { isUnlocked } = useFoundationLessonState(lessonSlug);
  const lessonJourney = getFoundationLessonJourney(lessonSlug);
  const previousPublishedLesson = lessonJourney?.current.courseNumber
    ? FOUNDATION_PUBLISHED_LESSONS[lessonJourney.current.courseNumber - 2]
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

  const nextLesson = lessonJourney?.next;
  const completionDescription = nextLesson
    ? lessonJourney.startsNextLevel
      ? `${levelTitle} is complete. ${nextLesson.levelTitle} is now unlocked and ready when you are.`
      : `Your progress is saved. “${nextLesson.lesson.title}” is now unlocked.`
    : "You completed every published Developer Foundations lesson. You can review any lesson from the course map.";
  const courseMapHref = getFoundationCourseMapHref(lessonSlug);

  return (
    <GuidedLessonFlow
      lessonId={lessonSlug}
      lessonVersion={lessonVersion}
      courseHref={courseMapHref}
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
      nextLesson={nextLesson ? {
        href: `/lessons/${nextLesson.lesson.slug}`,
        title: nextLesson.lesson.title,
        eyebrow: lessonJourney?.startsNextLevel
          ? `${nextLesson.levelLabel} unlocked`
          : `Next · ${nextLesson.levelLabel} lesson ${nextLesson.number}`,
        actionLabel: lessonJourney?.startsNextLevel
          ? `Start ${nextLesson.levelLabel}`
          : "Continue to next lesson",
      } : undefined}
      courseSlug="foundations"
      lessonProgressSlug={lessonSlug}
      finalButtonLabel="Complete lesson"
    >
      {children}
    </GuidedLessonFlow>
  );
}
