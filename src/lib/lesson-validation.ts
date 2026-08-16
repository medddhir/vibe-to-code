import {
  LESSON_CATALOG_SCHEMA_VERSION,
  LESSON_CONTENT_SCHEMA_VERSION,
  LESSON_PUBLICATION_STATES,
  isSupportedLessonBlockType,
  type LessonCatalogEntry,
  type LessonContentDefinition,
} from "@/data/lesson-schema";

export class LessonValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Lesson architecture validation failed:\n- ${issues.join("\n- ")}`);
    this.name = "LessonValidationError";
    this.issues = issues;
  }
}

function duplicateValues(values: readonly string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  values.forEach((value) => {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });
  return [...duplicates];
}

function isPositiveInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

const FORBIDDEN_CONTENT_KEYS = new Set([
  "component",
  "componentName",
  "dangerouslySetInnerHTML",
  "html",
  "iframe",
  "rawHtml",
  "script",
]);

function findUnsafeContent(value: unknown, path: string, issues: string[]) {
  if (typeof value === "function") {
    issues.push(`${path} contains executable data`);
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => findUnsafeContent(item, `${path}[${index}]`, issues));
    return;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    issues.push(`${path} contains non-serializable data`);
    return;
  }
  Object.entries(value).forEach(([key, child]) => {
    if (FORBIDDEN_CONTENT_KEYS.has(key)) {
      issues.push(`${path}.${key} is not allowed in lesson data`);
    }
    findUnsafeContent(child, `${path}.${key}`, issues);
  });
}

export function validateLessonCatalog(entries: readonly LessonCatalogEntry[]) {
  const issues: string[] = [];
  const slugs = entries.map((entry) => entry.lessonSlug);
  const routes = entries.flatMap((entry) => entry.route ? [entry.route] : []);
  const positions = entries.map(
    (entry) => `${entry.courseSlug}:${entry.levelIndex}:${entry.lessonIndex}`,
  );

  duplicateValues(slugs).forEach((slug) => issues.push(`Duplicate lesson slug: ${slug}`));
  duplicateValues(routes).forEach((route) => issues.push(`Duplicate lesson route: ${route}`));
  duplicateValues(positions).forEach((position) =>
    issues.push(`Duplicate course/level/lesson position: ${position}`),
  );

  entries.forEach((entry) => {
    const label = entry.lessonSlug || "<missing slug>";
    if (entry.schemaVersion !== LESSON_CATALOG_SCHEMA_VERSION) {
      issues.push(`${label} has invalid catalog schema version`);
    }
    if (!isPositiveInteger(entry.lessonVersion)) {
      issues.push(`${label} has invalid lesson version`);
    }
    if (!isPositiveInteger(entry.estimatedMinutes)) {
      issues.push(`${label} has invalid estimated duration`);
    }
    if (!entry.title?.trim()) issues.push(`${label} is missing a title`);
    if (!(LESSON_PUBLICATION_STATES as readonly string[]).includes(entry.publicationState)) {
      issues.push(`${label} has invalid publication state`);
    }
    if (entry.publicationState === "published" && !entry.route) {
      issues.push(`${label} is published without a route`);
    }
    if (entry.publicationState !== "published" && entry.route) {
      issues.push(`${label} is ${entry.publicationState} but has a route`);
    }
    if (entry.publicationState === "published" && entry.route !== `/lessons/${entry.lessonSlug}`) {
      issues.push(`${label} has a published route inconsistent with its slug`);
    }
    if (entry.publicationState === "published" && entry.access === "unavailable") {
      issues.push(`${label} is published with unavailable access`);
    }
    if (entry.publicationState !== "published" && entry.access !== "unavailable") {
      issues.push(`${label} is unpublished but has routable access metadata`);
    }
    duplicateValues(entry.progressStepIds).forEach((id) =>
      issues.push(`${label} has duplicate step ID: ${id}`),
    );
    duplicateValues(entry.activityIds).forEach((id) =>
      issues.push(`${label} has duplicate activity ID: ${id}`),
    );
  });

  const published = entries
    .filter((entry) => entry.publicationState === "published")
    .sort((left, right) =>
      left.courseSlug.localeCompare(right.courseSlug) ||
      left.levelIndex - right.levelIndex ||
      left.lessonIndex - right.lessonIndex,
    );
  published.forEach((entry, index) => {
    const expectedPrevious = published[index - 1]?.courseSlug === entry.courseSlug
      ? published[index - 1].lessonSlug
      : null;
    const expectedNext = published[index + 1]?.courseSlug === entry.courseSlug
      ? published[index + 1].lessonSlug
      : null;
    if (entry.previousLessonSlug !== expectedPrevious) {
      issues.push(`${entry.lessonSlug} has a broken previous relationship`);
    }
    if (entry.nextLessonSlug !== expectedNext) {
      issues.push(`${entry.lessonSlug} has a broken next relationship`);
    }
  });

  return issues;
}

export function validateLessonContentDefinition(definition: LessonContentDefinition) {
  const issues: string[] = [];
  const label = definition.lessonSlug || "<missing slug>";
  findUnsafeContent(definition, label, issues);
  if (definition.schemaVersion !== LESSON_CONTENT_SCHEMA_VERSION) {
    issues.push(`${label} has invalid content schema version`);
  }
  if (!definition.objective?.trim()) issues.push(`${label} is missing an objective`);
  if (!definition.misconception?.trim()) issues.push(`${label} is missing a misconception`);

  const stepIds = definition.guidedSteps.map((step) => step.id);
  const activityIds = definition.activities.map((activity) => activity.id);
  duplicateValues(stepIds).forEach((id) => issues.push(`${label} has duplicate step ID: ${id}`));
  duplicateValues(activityIds).forEach((id) => issues.push(`${label} has duplicate activity ID: ${id}`));

  const knownActivities = new Set(activityIds);
  const requiredIds = [
    ...definition.completionRule.requiredActivityIds,
    ...definition.guidedSteps.flatMap((step) => step.requiredActivityIds),
  ];
  requiredIds.forEach((id) => {
    if (!knownActivities.has(id)) issues.push(`${label} requires missing activity ID: ${id}`);
  });

  definition.guidedSteps.forEach((step) => {
    step.blocks.forEach((block) => {
      if (!isSupportedLessonBlockType((block as { type: string }).type)) {
        issues.push(`${label}/${step.id} uses unsupported block type`);
        return;
      }
      if (
        (block.type === "single-answer-checkpoint" || block.type === "ordering-checkpoint") &&
        !knownActivities.has(block.activityId)
      ) {
        issues.push(`${label}/${step.id} references missing activity ID: ${block.activityId}`);
      }
    });
  });

  definition.activities.forEach((activity) => {
    if (activity.type === "single-answer") {
      const optionIds = activity.options.map((option) => option.id);
      duplicateValues(optionIds).forEach((id) =>
        issues.push(`${label}/${activity.id} has duplicate option ID: ${id}`),
      );
      if (!optionIds.includes(activity.correctOptionId)) {
        issues.push(`${label}/${activity.id} has an unknown correct option`);
      }
    } else {
      const itemIds = activity.items.map((item) => item.id);
      if (
        duplicateValues(itemIds).length > 0 ||
        duplicateValues(activity.correctOrder).length > 0 ||
        itemIds.length !== activity.correctOrder.length ||
        activity.correctOrder.some((id) => !itemIds.includes(id))
      ) {
        issues.push(`${label}/${activity.id} has an invalid deterministic order`);
      }
    }
  });

  return issues;
}

export function validatePublishedLessonRegistry(
  catalog: readonly LessonCatalogEntry[],
  publishedRegistry: readonly LessonCatalogEntry[],
) {
  const issues: string[] = [];
  publishedRegistry.forEach((entry) => {
    if (entry.publicationState !== "published") {
      issues.push(`${entry.lessonSlug} is not published but appears in the published registry`);
    }
  });
  const expected = catalog.filter((entry) => entry.publicationState === "published");
  if (
    expected.length !== publishedRegistry.length ||
    expected.some((entry, index) => entry.lessonSlug !== publishedRegistry[index]?.lessonSlug)
  ) {
    issues.push("Published registry does not match catalog publication order");
  }
  return issues;
}

export function assertValidLessonCatalog(entries: readonly LessonCatalogEntry[]) {
  const issues = validateLessonCatalog(entries);
  if (issues.length) throw new LessonValidationError(issues);
}

export function assertValidLessonContentDefinition(definition: LessonContentDefinition) {
  const issues = validateLessonContentDefinition(definition);
  if (issues.length) throw new LessonValidationError(issues);
}
