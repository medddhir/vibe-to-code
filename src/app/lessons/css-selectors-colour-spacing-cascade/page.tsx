import type { Metadata } from "next";
import { FoundationLessonPage } from "@/components/foundations/foundation-lesson-page";
import { GenericLessonContentRenderer } from "@/components/generic-lesson-renderer";
import { foundationLevels } from "@/data/course-content";
import { lessonContentRegistry } from "@/data/lesson-content-registry";
import { FOUNDATION_TOTAL_LESSONS, getFoundationsCourseLessonNumber, getFoundationsLessonNumber } from "@/data/foundations-level1";
import { requireAuthenticatedLessonAccess } from "@/lib/auth/lesson-access";
import { getGuidedStepsForLessonDefinition } from "@/lib/guided-lesson-definition";
import { getPublishedLessonBySlug } from "@/lib/lesson-registry";

export const dynamic = "force-dynamic";
const lessonSlug = "css-selectors-colour-spacing-cascade";
const route = "/lessons/css-selectors-colour-spacing-cascade";

function getTrustedLessonBundle() {
  const catalogEntry = getPublishedLessonBySlug(lessonSlug);
  const definition = lessonContentRegistry.bySlug(lessonSlug);
  if (!catalogEntry || catalogEntry.renderMode !== "data-driven" || !definition) throw new Error(`Trusted published lesson bundle is missing for ${lessonSlug}`);
  return { catalogEntry, definition };
}

const { catalogEntry, definition } = getTrustedLessonBundle();
const level = foundationLevels[catalogEntry.levelIndex];
const lessonNumber = getFoundationsLessonNumber(lessonSlug) ?? 7;
const courseLessonNumber = getFoundationsCourseLessonNumber(lessonSlug) ?? 21;
const guidedSteps = getGuidedStepsForLessonDefinition(definition);
export const metadata: Metadata = { title: "Level 2 · Lesson 7: CSS selectors, colour, spacing, and cascade", description: definition.objective };

export default async function CssSelectorsLesson() {
  await requireAuthenticatedLessonAccess(route);
  return <FoundationLessonPage lessonSlug={lessonSlug} lessonNumber={lessonNumber} lessonTitle={catalogEntry.title} levelTitle={level?.label ?? "Level 2"} totalLessons={level?.lessons.length ?? 9} courseLessonNumber={courseLessonNumber} courseTotalLessons={FOUNDATION_TOTAL_LESSONS} lessonVersion={catalogEntry.lessonVersion} estimatedMinutes={catalogEntry.estimatedMinutes} steps={guidedSteps}>
    {definition.guidedSteps.map((step) => <GenericLessonContentRenderer key={step.id} definition={definition} stepId={step.id} />)}
  </FoundationLessonPage>;
}
