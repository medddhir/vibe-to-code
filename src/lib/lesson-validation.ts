import {
  LESSON_CATALOG_SCHEMA_VERSION,
  LESSON_CONTENT_SCHEMA_VERSION,
  LESSON_PUBLICATION_STATES,
  SUPPORTED_LESSON_BLOCK_TYPES,
} from "@/data/lesson-schema";
import { PUBLIC_LESSON_IDENTITY } from "@/data/lesson-publication";

export class LessonValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Lesson architecture validation failed:\n- ${issues.join("\n- ")}`);
    this.name = "LessonValidationError";
    this.issues = issues;
  }
}

type RecordValue = Record<string, unknown>;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ROUTE_PATTERN = /^\/lessons\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CATALOG_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*:level:\d+:lesson:\d+$/;
const RESERVED_PROVISIONAL_SLUG_PATTERN = /^planned-[a-z0-9]+(?:-[a-z0-9]+)*-level-\d+-lesson-\d+$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const FORBIDDEN_CONTENT_KEYS = new Set([
  "component",
  "componentName",
  "dangerouslySetInnerHTML",
  "html",
  "iframe",
  "rawHtml",
  "script",
]);

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPlainRecord(value: unknown): value is RecordValue {
  if (!isRecord(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
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

function nonblank(value: unknown, path: string, issues: string[]) {
  if (typeof value !== "string" || !value.trim()) {
    issues.push(`${path} must be a nonblank string`);
    return null;
  }
  return value;
}

function nonnegativeInteger(value: unknown, path: string, issues: string[]) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    issues.push(`${path} must be a nonnegative integer`);
    return null;
  }
  return value;
}

function positiveInteger(value: unknown, path: string, issues: string[]) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    issues.push(`${path} must be a positive integer`);
    return null;
  }
  return value;
}

function readSafeArray(value: unknown, path: string, issues: string[]) {
  if (!Array.isArray(value)) {
    issues.push(`${path} must be an array`);
    return null;
  }
  if (Object.getPrototypeOf(value) !== Array.prototype) {
    issues.push(`${path} must use the normal Array prototype`);
    return null;
  }

  const ownKeys = Reflect.ownKeys(value);
  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
  if (!lengthDescriptor || lengthDescriptor.get || lengthDescriptor.set ||
      typeof lengthDescriptor.value !== "number" || !Number.isSafeInteger(lengthDescriptor.value) ||
      lengthDescriptor.value < 0) {
    issues.push(`${path}.length must be a safe own data property`);
    return null;
  }

  const length = lengthDescriptor.value;
  const indexDescriptors: Array<[number, PropertyDescriptor]> = [];
  let safe = true;
  for (let keyIndex = 0; keyIndex < ownKeys.length; keyIndex += 1) {
    const key = ownKeys[keyIndex];
    if (key === "length") continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key === "symbol") {
      issues.push(`${path} contains a symbol key`);
      if (!descriptor || descriptor.get || descriptor.set) {
        issues.push(`${path} contains executable symbol property access`);
      }
      safe = false;
      continue;
    }
    if (!descriptor || descriptor.get || descriptor.set) {
      issues.push(`${path}.${key} contains executable property access`);
      safe = false;
      continue;
    }
    const isCanonicalIndex = /^(0|[1-9]\d*)$/.test(key) &&
      Number.isSafeInteger(Number(key)) && Number(key) < length;
    if (!isCanonicalIndex) {
      if (FORBIDDEN_CONTENT_KEYS.has(key)) issues.push(`${path}.${key} is not allowed in lesson data`);
      issues.push(`${path}.${key} is not an allowed array property`);
      safe = false;
      continue;
    }
    if (descriptor.enumerable !== true) {
      issues.push(`${path}[${key}] must be enumerable`);
      safe = false;
      continue;
    }
    indexDescriptors.push([Number(key), descriptor]);
  }

  indexDescriptors.sort(([left], [right]) => left - right);
  const firstGap = indexDescriptors.findIndex(([index], position) => index !== position);
  if (indexDescriptors.length !== length || firstGap !== -1) {
    const firstMissingIndex = firstGap === -1 ? indexDescriptors.length : firstGap;
    issues.push(`${path}[${firstMissingIndex}] is a sparse array hole`);
    safe = false;
  }
  if (!safe) return null;

  const dense = new Array<unknown>(indexDescriptors.length);
  for (let index = 0; index < indexDescriptors.length; index += 1) {
    dense[index] = indexDescriptors[index][1].value;
  }
  return dense;
}

function stringIdArray(value: unknown, path: string, issues: string[]) {
  const values = readSafeArray(value, path, issues);
  if (!values) return [];
  const valid: string[] = [];
  values.forEach((item, index) => {
    const id = nonblank(item, `${path}[${index}]`, issues);
    if (id) valid.push(id);
  });
  duplicateValues(valid).forEach((id) => issues.push(`${path} contains duplicate ID: ${id}`));
  return valid;
}

function safeValidate(run: (issues: string[]) => void) {
  const issues: string[] = [];
  try {
    run(issues);
  } catch {
    issues.push("Input could not be safely inspected");
  }
  return issues;
}

function validateCatalogEntry(entry: unknown, path: string, issues: string[]) {
  if (!isPlainRecord(entry)) {
    issues.push(`${path} must be a plain object`);
    return null;
  }

  if (entry.schemaVersion !== LESSON_CATALOG_SCHEMA_VERSION) {
    issues.push(`${path}.schemaVersion is invalid`);
  }
  const stableCatalogId = nonblank(entry.catalogId, `${path}.catalogId`, issues);
  if (stableCatalogId && !CATALOG_ID_PATTERN.test(stableCatalogId)) {
    issues.push(`${path}.catalogId is malformed`);
  }
  const courseSlug = nonblank(entry.courseSlug, `${path}.courseSlug`, issues);
  const lessonSlug = nonblank(entry.lessonSlug, `${path}.lessonSlug`, issues);
  if (courseSlug && !SLUG_PATTERN.test(courseSlug)) issues.push(`${path}.courseSlug is malformed`);
  if (lessonSlug && !SLUG_PATTERN.test(lessonSlug)) issues.push(`${path}.lessonSlug is malformed`);
  if (lessonSlug && RESERVED_PROVISIONAL_SLUG_PATTERN.test(lessonSlug) && entry.slugState !== "provisional") {
    issues.push(`${path}.lessonSlug is a reserved provisional placeholder`);
  }
  const levelIndex = nonnegativeInteger(entry.levelIndex, `${path}.levelIndex`, issues);
  const lessonIndex = nonnegativeInteger(entry.lessonIndex, `${path}.lessonIndex`, issues);
  positiveInteger(entry.lessonVersion, `${path}.lessonVersion`, issues);
  positiveInteger(entry.estimatedMinutes, `${path}.estimatedMinutes`, issues);
  nonblank(entry.title, `${path}.title`, issues);

  const states = LESSON_PUBLICATION_STATES as readonly unknown[];
  if (!states.includes(entry.publicationState)) issues.push(`${path}.publicationState is invalid`);
  if (!( ["legacy-bespoke", "data-driven"] as unknown[]).includes(entry.renderMode)) {
    issues.push(`${path}.renderMode is invalid`);
  }
  if (!( ["public", "authenticated", "unavailable"] as unknown[]).includes(entry.access)) {
    issues.push(`${path}.access is invalid`);
  }
  if (!( ["provisional", "permanent"] as unknown[]).includes(entry.slugState)) {
    issues.push(`${path}.slugState is invalid`);
  }
  if (stableCatalogId && courseSlug && levelIndex !== null && lessonIndex !== null &&
      stableCatalogId !== `${courseSlug}:level:${levelIndex}:lesson:${lessonIndex}`) {
    issues.push(`${path}.catalogId does not match its stable catalog position`);
  }
  if (entry.slugState === "provisional" && courseSlug && levelIndex !== null && lessonIndex !== null &&
      lessonSlug !== `planned-${courseSlug}-level-${levelIndex}-lesson-${lessonIndex}`) {
    issues.push(`${path}.lessonSlug does not match its provisional identity`);
  }

  if (entry.route !== null && (typeof entry.route !== "string" || !ROUTE_PATTERN.test(entry.route))) {
    issues.push(`${path}.route is malformed`);
  }
  if (entry.publicationState === "published") {
    if (entry.route !== `/lessons/${lessonSlug ?? ""}`) issues.push(`${path} is published without its canonical route`);
    if (entry.access !== "public" && entry.access !== "authenticated") issues.push(`${path} has invalid published access`);
    if (entry.slugState !== "permanent") issues.push(`${path} must have a permanent slug before publication`);
  } else {
    if (entry.route !== null) issues.push(`${path} is unpublished but has a route`);
    if (entry.access !== "unavailable") issues.push(`${path} is unpublished but has routable access`);
  }
  const isRequiredPublicLesson = courseSlug === PUBLIC_LESSON_IDENTITY.courseSlug &&
    lessonSlug === PUBLIC_LESSON_IDENTITY.lessonSlug;
  if (entry.access === "public" && (
    !isRequiredPublicLesson || entry.route !== PUBLIC_LESSON_IDENTITY.route
  )) {
    issues.push(`${path} attempts to create a second public lesson`);
  }
  if (entry.publicationState === "published" && isRequiredPublicLesson && entry.access !== "public") {
    issues.push(`${path} must keep what-is-code public`);
  }
  if (entry.publicationState === "draft" && entry.slugState !== "permanent") {
    issues.push(`${path} must have a permanent slug before draft`);
  }

  for (const key of ["previousLessonSlug", "nextLessonSlug"] as const) {
    const value = entry[key];
    if (value !== null && (typeof value !== "string" || !SLUG_PATTERN.test(value))) {
      issues.push(`${path}.${key} is malformed`);
    }
  }
  const progressStepIds = stringIdArray(entry.progressStepIds, `${path}.progressStepIds`, issues);
  const activityIds = stringIdArray(entry.activityIds, `${path}.activityIds`, issues);
  return { entry, courseSlug, lessonSlug, progressStepIds, activityIds };
}

function validateCatalogInternal(input: unknown, issues: string[]) {
  const entries = readSafeArray(input, "catalog", issues);
  if (!entries) return;
  const valid = entries.flatMap((entry, index) => {
    const result = validateCatalogEntry(entry, `catalog[${index}]`, issues);
    return result ? [result] : [];
  });

  const slugs = valid.flatMap(({ lessonSlug }) => lessonSlug ? [lessonSlug] : []);
  const routes = valid.flatMap(({ entry }) => typeof entry.route === "string" ? [entry.route] : []);
  const positions = valid.flatMap(({ entry, courseSlug }) =>
    courseSlug && Number.isSafeInteger(entry.levelIndex) && Number.isSafeInteger(entry.lessonIndex)
      ? [`${courseSlug}:${entry.levelIndex}:${entry.lessonIndex}`]
      : [],
  );
  const catalogIds = valid.flatMap(({ entry }) => typeof entry.catalogId === "string" ? [entry.catalogId] : []);
  duplicateValues(slugs).forEach((value) => issues.push(`Duplicate lesson slug: ${value}`));
  duplicateValues(routes).forEach((value) => issues.push(`Duplicate lesson route: ${value}`));
  duplicateValues(positions).forEach((value) => issues.push(`Duplicate course/level/lesson position: ${value}`));
  duplicateValues(catalogIds).forEach((value) => issues.push(`Duplicate catalog ID: ${value}`));

  const published = valid
    .filter(({ entry }) => entry.publicationState === "published")
    .sort((left, right) =>
      String(left.entry.courseSlug).localeCompare(String(right.entry.courseSlug)) ||
      Number(left.entry.levelIndex) - Number(right.entry.levelIndex) ||
      Number(left.entry.lessonIndex) - Number(right.entry.lessonIndex),
    );
  const requiredPublic = published.filter(({ entry }) =>
    entry.courseSlug === PUBLIC_LESSON_IDENTITY.courseSlug &&
    entry.lessonSlug === PUBLIC_LESSON_IDENTITY.lessonSlug &&
    entry.route === PUBLIC_LESSON_IDENTITY.route &&
    entry.access === "public",
  );
  const otherPublic = published.filter(({ entry }) => entry.access === "public" &&
    !(entry.courseSlug === PUBLIC_LESSON_IDENTITY.courseSlug &&
      entry.lessonSlug === PUBLIC_LESSON_IDENTITY.lessonSlug &&
      entry.route === PUBLIC_LESSON_IDENTITY.route));
  if (requiredPublic.length !== 1) issues.push("Catalog must contain what-is-code as the one public lesson");
  if (otherPublic.length > 0) issues.push("Catalog contains a second public lesson");
  published.forEach(({ entry }, index) => {
    const previous = published[index - 1]?.entry.courseSlug === entry.courseSlug
      ? published[index - 1].entry.lessonSlug
      : null;
    const next = published[index + 1]?.entry.courseSlug === entry.courseSlug
      ? published[index + 1].entry.lessonSlug
      : null;
    if (entry.previousLessonSlug !== previous) issues.push(`${entry.lessonSlug} has a broken previous relationship`);
    if (entry.nextLessonSlug !== next) issues.push(`${entry.lessonSlug} has a broken next relationship`);
  });
}

export function validateLessonCatalog(input: unknown) {
  return safeValidate((issues) => validateCatalogInternal(input, issues));
}

function scanSerializable(
  value: unknown,
  path: string,
  issues: string[],
  ancestors: WeakSet<object>,
): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return false;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) issues.push(`${path} contains a non-finite number`);
    return false;
  }
  if (typeof value === "undefined" || typeof value === "bigint" ||
      typeof value === "symbol" || typeof value === "function") {
    issues.push(`${path} contains non-serializable ${typeof value}`);
    return false;
  }
  if (ancestors.has(value)) {
    issues.push(`${path} contains a cyclic reference`);
    return false;
  }
  ancestors.add(value);
  let unsafeToInspect = false;
  try {
    if (Array.isArray(value)) {
      const values = readSafeArray(value, path, issues);
      if (!values) return true;
      for (let index = 0; index < values.length; index += 1) {
        if (scanSerializable(values[index], `${path}[${index}]`, issues, ancestors)) {
          unsafeToInspect = true;
        }
      }
      return unsafeToInspect;
    }
    if (!isPlainRecord(value)) {
      issues.push(`${path} contains a non-plain object`);
      return false;
    }
    Reflect.ownKeys(value).forEach((key) => {
      if (typeof key === "symbol") {
        issues.push(`${path} contains a symbol key`);
        return;
      }
      if (FORBIDDEN_CONTENT_KEYS.has(key)) issues.push(`${path}.${key} is not allowed in lesson data`);
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || descriptor.get || descriptor.set) {
        issues.push(`${path}.${key} contains executable property access`);
        unsafeToInspect = true;
        return;
      }
      if (descriptor.enumerable !== true) {
        issues.push(`${path}.${key} must be enumerable`);
        unsafeToInspect = true;
        return;
      }
      if (scanSerializable(descriptor.value, `${path}.${key}`, issues, ancestors)) {
        unsafeToInspect = true;
      }
    });
    return unsafeToInspect;
  } finally {
    ancestors.delete(value);
  }
}

function validateTextArray(value: unknown, path: string, issues: string[], requireOne = false) {
  const values = readSafeArray(value, path, issues);
  if (!values) return [];
  if (requireOne && values.length === 0) issues.push(`${path} must not be empty`);
  const valid: string[] = [];
  values.forEach((item, index) => {
    const text = nonblank(item, `${path}[${index}]`, issues);
    if (text) valid.push(text);
  });
  if (requireOne && valid.length === 0) issues.push(`${path} must contain at least one real value`);
  return valid;
}

function validateBlock(block: unknown, path: string, issues: string[]) {
  if (!isPlainRecord(block)) {
    issues.push(`${path} must be a plain object`);
    return null;
  }
  if (!(SUPPORTED_LESSON_BLOCK_TYPES as readonly unknown[]).includes(block.type)) {
    issues.push(`${path}.type is invalid`);
    return null;
  }
  switch (block.type) {
    case "explanation":
      nonblank(block.heading, `${path}.heading`, issues);
      validateTextArray(block.body, `${path}.body`, issues, true);
      break;
    case "callout":
      if (!( ["note", "success", "warning"] as unknown[]).includes(block.tone)) issues.push(`${path}.tone is invalid`);
      nonblank(block.heading, `${path}.heading`, issues);
      nonblank(block.body, `${path}.body`, issues);
      break;
    case "example":
      nonblank(block.title, `${path}.title`, issues);
      nonblank(block.code, `${path}.code`, issues);
      if (block.output !== undefined && typeof block.output !== "string") issues.push(`${path}.output must be a string`);
      break;
    case "single-answer-checkpoint":
    case "ordering-checkpoint":
      return {
        activityId: nonblank(block.activityId, `${path}.activityId`, issues),
        expectedType: block.type === "single-answer-checkpoint" ? "single-answer" : "ordering",
      };
    case "recap":
      nonblank(block.heading, `${path}.heading`, issues);
      validateTextArray(block.points, `${path}.points`, issues, true);
      break;
    case "transfer-challenge":
      nonblank(block.heading, `${path}.heading`, issues);
      nonblank(block.prompt, `${path}.prompt`, issues);
      validateTextArray(block.successCriteria, `${path}.successCriteria`, issues, true);
      break;
  }
  return null;
}

function validateActivity(activity: unknown, path: string, issues: string[]) {
  if (!isPlainRecord(activity)) {
    issues.push(`${path} must be a plain object`);
    return null;
  }
  const id = nonblank(activity.id, `${path}.id`, issues);
  if (activity.type !== "single-answer" && activity.type !== "ordering") {
    issues.push(`${path}.type is invalid`);
    return id ? { id, type: null } : null;
  }
  nonblank(activity.title, `${path}.title`, issues);
  if (activity.type === "single-answer") {
    nonblank(activity.question, `${path}.question`, issues);
    nonblank(activity.successMessage, `${path}.successMessage`, issues);
    nonblank(activity.hint, `${path}.hint`, issues);
    const options = readSafeArray(activity.options, `${path}.options`, issues);
    const optionIds: string[] = [];
    if (options) {
      if (options.length < 2) issues.push(`${path}.options must contain at least two options`);
      options.forEach((option, index) => {
        if (!isPlainRecord(option)) {
          issues.push(`${path}.options[${index}] must be a plain object`);
          return;
        }
        const optionId = nonblank(option.id, `${path}.options[${index}].id`, issues);
        if (optionId) optionIds.push(optionId);
        nonblank(option.label, `${path}.options[${index}].label`, issues);
        nonblank(option.feedback, `${path}.options[${index}].feedback`, issues);
      });
    }
    duplicateValues(optionIds).forEach((value) => issues.push(`${path}.options contains duplicate ID: ${value}`));
    const correctId = nonblank(activity.correctOptionId, `${path}.correctOptionId`, issues);
    if (correctId && !optionIds.includes(correctId)) issues.push(`${path}.correctOptionId is unknown`);
  } else {
    nonblank(activity.prompt, `${path}.prompt`, issues);
    nonblank(activity.successMessage, `${path}.successMessage`, issues);
    nonblank(activity.errorMessage, `${path}.errorMessage`, issues);
    const items = readSafeArray(activity.items, `${path}.items`, issues);
    const itemIds: string[] = [];
    if (items) {
      if (items.length < 2) issues.push(`${path}.items must contain at least two items`);
      items.forEach((item, index) => {
        if (!isPlainRecord(item)) {
          issues.push(`${path}.items[${index}] must be a plain object`);
          return;
        }
        const itemId = nonblank(item.id, `${path}.items[${index}].id`, issues);
        if (itemId) itemIds.push(itemId);
        nonblank(item.label, `${path}.items[${index}].label`, issues);
      });
    }
    duplicateValues(itemIds).forEach((value) => issues.push(`${path}.items contains duplicate ID: ${value}`));
    const order = stringIdArray(activity.correctOrder, `${path}.correctOrder`, issues);
    if (order.length !== itemIds.length || order.some((value) => !itemIds.includes(value))) {
      issues.push(`${path}.correctOrder must contain every item ID exactly once`);
    }
  }
  return id ? { id, type: activity.type } : null;
}

function validateContentInternal(input: unknown, issues: string[]) {
  const unsafeToInspect = scanSerializable(input, "content", issues, new WeakSet());
  if (unsafeToInspect) return null;
  if (!isPlainRecord(input)) {
    issues.push("content must be a plain object");
    return null;
  }
  if (input.schemaVersion !== LESSON_CONTENT_SCHEMA_VERSION) issues.push("content.schemaVersion is invalid");
  const lessonSlug = nonblank(input.lessonSlug, "content.lessonSlug", issues);
  if (lessonSlug && !SLUG_PATTERN.test(lessonSlug)) issues.push("content.lessonSlug is malformed");
  positiveInteger(input.lessonVersion, "content.lessonVersion", issues);
  nonblank(input.objective, "content.objective", issues);
  validateTextArray(input.prerequisites, "content.prerequisites", issues);
  const outcomes = validateTextArray(input.learningOutcomes, "content.learningOutcomes", issues);
  nonblank(input.misconception, "content.misconception", issues);

  const activitiesInput = readSafeArray(input.activities, "content.activities", issues);
  const activities = new Map<string, string | null>();
  if (activitiesInput) {
    activitiesInput.forEach((activity, index) => {
      const validated = validateActivity(activity, `content.activities[${index}]`, issues);
      if (validated) {
        if (activities.has(validated.id)) issues.push(`content.activities contains duplicate ID: ${validated.id}`);
        else activities.set(validated.id, validated.type);
      }
    });
  }

  const completion = input.completionRule;
  let completionRequired: string[] = [];
  if (!isPlainRecord(completion)) issues.push("content.completionRule must be a plain object");
  else {
    if (completion.type !== "all-steps-and-required-activities") issues.push("content.completionRule.type is invalid");
    completionRequired = stringIdArray(completion.requiredActivityIds, "content.completionRule.requiredActivityIds", issues);
  }

  const stepsInput = readSafeArray(input.guidedSteps, "content.guidedSteps", issues);
  const stepIds: string[] = [];
  const rendered = new Map<string, { count: number; stepId: string; expectedType: string }>();
  const stepRequirements: { stepId: string; ids: string[] }[] = [];
  if (stepsInput) {
    if (stepsInput.length === 0) issues.push("content.guidedSteps must not be empty");
    stepsInput.forEach((step, index) => {
      const path = `content.guidedSteps[${index}]`;
      if (!isPlainRecord(step)) {
        issues.push(`${path} must be a plain object`);
        return;
      }
      const stepId = nonblank(step.id, `${path}.id`, issues);
      if (stepId) stepIds.push(stepId);
      nonblank(step.title, `${path}.title`, issues);
      nonblank(step.eyebrow, `${path}.eyebrow`, issues);
      const required = stringIdArray(step.requiredActivityIds, `${path}.requiredActivityIds`, issues);
      if (stepId) stepRequirements.push({ stepId, ids: required });
      const blocks = readSafeArray(step.blocks, `${path}.blocks`, issues);
      if (blocks) {
        if (blocks.length === 0) issues.push(`${path}.blocks must not be empty`);
        blocks.forEach((block, blockIndex) => {
          const checkpoint = validateBlock(block, `${path}.blocks[${blockIndex}]`, issues);
          if (checkpoint?.activityId && stepId) {
            const previous = rendered.get(checkpoint.activityId);
            rendered.set(checkpoint.activityId, {
              count: (previous?.count ?? 0) + 1,
              stepId: previous?.stepId ?? stepId,
              expectedType: checkpoint.expectedType,
            });
            const actualType = activities.get(checkpoint.activityId);
            if (!activities.has(checkpoint.activityId)) issues.push(`${path} references unknown activity: ${checkpoint.activityId}`);
            else if (actualType !== checkpoint.expectedType) issues.push(`${path} checkpoint type does not match activity ${checkpoint.activityId}`);
          }
        });
      }
    });
  }
  duplicateValues(stepIds).forEach((value) => issues.push(`content.guidedSteps contains duplicate ID: ${value}`));

  activities.forEach((_type, id) => {
    const location = rendered.get(id);
    if (!location) issues.push(`Activity ${id} is defined but has no rendered checkpoint`);
    else if (location.count !== 1) issues.push(`Activity ${id} is rendered more than once`);
  });
  completionRequired.forEach((id) => {
    if (!activities.has(id)) issues.push(`Required activity ${id} is not defined`);
    else if (!rendered.has(id)) issues.push(`Required activity ${id} has no rendered checkpoint`);
  });
  stepRequirements.forEach(({ stepId, ids }) => ids.forEach((id) => {
    if (!activities.has(id)) issues.push(`Step ${stepId} requires undefined activity ${id}`);
    const location = rendered.get(id);
    if (!location) issues.push(`Step ${stepId} requires unreachable activity ${id}`);
    else if (location.stepId !== stepId) issues.push(`Step ${stepId} requires activity ${id} rendered in step ${location.stepId}`);
  }));

  const sources = readSafeArray(input.sources, "content.sources", issues);
  const inspectedSources: RecordValue[] = [];
  let validSourceCount = 0;
  if (sources) sources.forEach((source, index) => {
    if (!isPlainRecord(source)) {
      issues.push(`content.sources[${index}] must be a plain object`);
      return;
    }
    inspectedSources.push(source);
    const title = nonblank(source.title, `content.sources[${index}].title`, issues);
    const url = nonblank(source.url, `content.sources[${index}].url`, issues);
    if (title && url) validSourceCount += 1;
  });
  if (input.sourceVerifiedAt !== null && typeof input.sourceVerifiedAt !== "string") {
    issues.push("content.sourceVerifiedAt must be a string or null");
  }

  return {
    input,
    lessonSlug,
    stepIds,
    activityIds: [...activities.keys()],
    outcomes,
    sources: inspectedSources,
    validSourceCount,
  };
}

export function validateLessonContentDefinition(input: unknown) {
  return safeValidate((issues) => { validateContentInternal(input, issues); });
}

function isRealDate(value: unknown) {
  if (typeof value !== "string") return false;
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function trustedContentBySlug(registry: unknown, slug: string, issues: string[]) {
  if (!isRecord(registry) || typeof registry.bySlug !== "function") {
    issues.push("Trusted content registry is invalid");
    return null;
  }
  try {
    return registry.bySlug(slug) as unknown;
  } catch {
    issues.push("Trusted content registry lookup failed closed");
    return null;
  }
}

export function validatePublishableLessonBundle(catalogEntry: unknown, contentRegistry: unknown) {
  return safeValidate((issues) => {
    const catalog = validateCatalogEntry(catalogEntry, "catalogEntry", issues);
    if (!catalog || !catalog.lessonSlug) return;
    const entry = catalog.entry;
    if (entry.publicationState !== "published") issues.push("catalogEntry must be published");
    if (entry.renderMode !== "data-driven") issues.push("catalogEntry must use data-driven render mode");
    if (entry.route !== `/lessons/${catalog.lessonSlug}`) issues.push("catalogEntry route is inconsistent");
    if (entry.access !== "public" && entry.access !== "authenticated") issues.push("catalogEntry access is inconsistent");
    if (entry.access === "public" && !(
      entry.courseSlug === PUBLIC_LESSON_IDENTITY.courseSlug &&
      entry.lessonSlug === PUBLIC_LESSON_IDENTITY.lessonSlug &&
      entry.route === PUBLIC_LESSON_IDENTITY.route
    )) issues.push("Only what-is-code may be a public publishable lesson");
    if (
      entry.courseSlug === PUBLIC_LESSON_IDENTITY.courseSlug &&
      entry.lessonSlug === PUBLIC_LESSON_IDENTITY.lessonSlug &&
      entry.access !== "public"
    ) issues.push("Publishable what-is-code must remain public");

    const definition = trustedContentBySlug(contentRegistry, catalog.lessonSlug, issues);
    if (!definition) {
      issues.push(`Trusted content definition is missing for ${catalog.lessonSlug}`);
      return;
    }
    const content = validateContentInternal(definition, issues);
    if (!content) {
      issues.push("Publishable content requires at least one learning outcome");
      issues.push("Publishable content requires at least one real guided step");
      issues.push("Publishable content requires at least one source with valid fields");
      return;
    }
    if (!isPlainRecord(definition)) return;
    if (content.lessonSlug !== catalog.lessonSlug) issues.push("Catalog and content lesson slugs do not match");
    if (definition.lessonVersion !== entry.lessonVersion) issues.push("Catalog and content lesson versions do not match");
    if (JSON.stringify(content.stepIds) !== JSON.stringify(catalog.progressStepIds)) {
      issues.push("Content step IDs do not exactly match catalog progressStepIds");
    }
    if (JSON.stringify(content.activityIds) !== JSON.stringify(catalog.activityIds)) {
      issues.push("Content activity IDs do not exactly match catalog activityIds");
    }
    if (content.outcomes.length === 0) issues.push("Publishable content requires at least one learning outcome");
    if (content.stepIds.length === 0) issues.push("Publishable content requires at least one real guided step");
    if (content.validSourceCount === 0) issues.push("Publishable content requires at least one source with valid fields");
    content.sources?.forEach((source, index) => {
      if (!isPlainRecord(source) || typeof source.url !== "string") return;
      try {
        const url = new URL(source.url);
        if (url.protocol !== "https:" || !url.hostname) throw new Error("not HTTPS");
      } catch {
        issues.push(`content.sources[${index}].url must be an absolute HTTPS URL`);
      }
    });
    if (!isRealDate(definition.sourceVerifiedAt)) {
      issues.push("Publishable content sourceVerifiedAt must be a real YYYY-MM-DD date");
    }
  });
}

export function validatePublishedDataDrivenLessons(catalog: unknown, contentRegistry: unknown) {
  return safeValidate((issues) => {
    issues.push(...validateLessonCatalog(catalog));
    const entries = readSafeArray(catalog, "catalog", issues);
    if (!entries) return;
    entries.forEach((entry) => {
      if (isRecord(entry) && entry.publicationState === "published" && entry.renderMode === "data-driven") {
        issues.push(...validatePublishableLessonBundle(entry, contentRegistry));
      }
    });
  });
}

export function validatePublishedLessonRegistry(catalog: unknown, publishedRegistry: unknown) {
  return safeValidate((issues) => {
    const catalogEntries = readSafeArray(catalog, "catalog", issues);
    const publishedEntries = readSafeArray(publishedRegistry, "publishedRegistry", issues);
    if (!catalogEntries || !publishedEntries) return;
    publishedEntries.forEach((entry, index) => {
      if (!isRecord(entry) || entry.publicationState !== "published") {
        issues.push(`publishedRegistry[${index}] is not published`);
      }
    });
    const expected = catalogEntries.filter((entry) => isRecord(entry) && entry.publicationState === "published");
    if (expected.length !== publishedEntries.length || expected.some((entry, index) =>
      !isRecord(entry) || !isRecord(publishedEntries[index]) ||
      entry.lessonSlug !== publishedEntries[index].lessonSlug)) {
      issues.push("Published registry does not match catalog publication order");
    }
  });
}

export function assertValidLessonCatalog(input: unknown) {
  const issues = validateLessonCatalog(input);
  if (issues.length) throw new LessonValidationError(issues);
}

export function assertValidLessonContentDefinition(input: unknown) {
  const issues = validateLessonContentDefinition(input);
  if (issues.length) throw new LessonValidationError(issues);
}

export function assertPublishableLessonBundle(catalogEntry: unknown, contentRegistry: unknown) {
  const issues = validatePublishableLessonBundle(catalogEntry, contentRegistry);
  if (issues.length) throw new LessonValidationError(issues);
}
