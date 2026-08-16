import type { LessonContentDefinition } from "@/data/lesson-schema";

export function getGuidedStepsForLessonDefinition(
  definition: LessonContentDefinition,
) {
  const completionActivityIds = definition.completionRule.requiredActivityIds;
  return definition.guidedSteps.map((step, index) => {
    const requiredActivityIds = index === definition.guidedSteps.length - 1
      ? [...new Set([...step.requiredActivityIds, ...completionActivityIds])]
      : [...step.requiredActivityIds];
    return {
      id: step.id,
      title: step.title,
      eyebrow: step.eyebrow,
      requiresPractice: requiredActivityIds.length > 0,
      requiredActivityIds,
    };
  });
}
