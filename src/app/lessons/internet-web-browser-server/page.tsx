import type { Metadata } from "next";

import { FoundationLessonPage } from "@/components/foundations/foundation-lesson-page";
import {
  GenericLessonContentRenderer,
} from "@/components/generic-lesson-renderer";
import { foundationLevels } from "@/data/course-content";
import { lessonContentRegistry } from "@/data/lesson-content-registry";
import {
  FOUNDATION_TOTAL_LESSONS,
  getFoundationsCourseLessonNumber,
  getFoundationsLessonNumber,
} from "@/data/foundations-level1";
import { requireAuthenticatedLessonAccess } from "@/lib/auth/lesson-access";
import { getGuidedStepsForLessonDefinition } from "@/lib/guided-lesson-definition";
import { getPublishedLessonBySlug } from "@/lib/lesson-registry";

export const dynamic = "force-dynamic";

const lessonSlug = "internet-web-browser-server";
const route = "/lessons/internet-web-browser-server";

function getTrustedLessonBundle() {
  const catalogEntry = getPublishedLessonBySlug(lessonSlug);
  const definition = lessonContentRegistry.bySlug(lessonSlug);
  if (!catalogEntry || catalogEntry.renderMode !== "data-driven" || !definition) {
    throw new Error(`Trusted published lesson bundle is missing for ${lessonSlug}`);
  }
  return { catalogEntry, definition };
}

const { catalogEntry, definition } = getTrustedLessonBundle();
const level = foundationLevels[catalogEntry.levelIndex];
const lessonNumber = getFoundationsLessonNumber(lessonSlug) ?? 1;
const courseLessonNumber = getFoundationsCourseLessonNumber(lessonSlug) ?? 15;
const guidedSteps = getGuidedStepsForLessonDefinition(definition);

export const metadata: Metadata = {
  title: `Level 2 · Lesson ${lessonNumber}: Internet, web, browser, and server`,
  description:
    "Separate the Internet, Web, browser, search engine, and server, then trace one simplified request-and-response journey.",
};

export default async function InternetWebBrowserServerLesson() {
  await requireAuthenticatedLessonAccess(route);

  return (
    <FoundationLessonPage
      lessonSlug={lessonSlug}
      lessonNumber={lessonNumber}
      lessonTitle={catalogEntry.title}
      levelTitle={level?.label ?? "Level 2"}
      totalLessons={level?.lessons.length ?? 9}
      courseLessonNumber={courseLessonNumber}
      courseTotalLessons={FOUNDATION_TOTAL_LESSONS}
      lessonVersion={catalogEntry.lessonVersion}
      estimatedMinutes={catalogEntry.estimatedMinutes}
      steps={guidedSteps}
    >
      {definition.guidedSteps.map((step) => (
        <GenericLessonContentRenderer
          key={step.id}
          definition={definition}
          stepId={step.id}
        />
      ))}
    </FoundationLessonPage>
  );
}
