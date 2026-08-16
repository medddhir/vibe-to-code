import type { LessonContentDefinition } from "@/data/lesson-schema";
import {
  assertValidLessonContentDefinition,
  LessonValidationError,
} from "@/lib/lesson-validation";

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Reflect.ownKeys(value).forEach((key) => deepFreeze((value as Record<PropertyKey, unknown>)[key]));
    Object.freeze(value);
  }
  return value;
}

function immutableContent(definition: LessonContentDefinition) {
  return deepFreeze(definition) as Readonly<LessonContentDefinition>;
}

export function createLessonContentRegistry(
  definitions: readonly LessonContentDefinition[],
) {
  const bySlug = new Map<string, Readonly<LessonContentDefinition>>();
  definitions.forEach((definition) => {
    assertValidLessonContentDefinition(definition);
    let clone: LessonContentDefinition;
    try {
      clone = structuredClone(definition);
    } catch {
      throw new LessonValidationError(["Validated lesson content could not be cloned"]);
    }
    assertValidLessonContentDefinition(clone);
    const lessonSlug = clone.lessonSlug;
    if (bySlug.has(lessonSlug)) {
      throw new Error(`Duplicate trusted lesson content slug: ${lessonSlug}`);
    }
    bySlug.set(lessonSlug, immutableContent(clone));
  });
  const all = Object.freeze([...bySlug.values()]);
  return Object.freeze({
    all: () => all,
    bySlug: (lessonSlug: string) => bySlug.get(lessonSlug) ?? null,
  });
}

/** No data-driven lesson content is trusted or published in this architecture PR. */
export const lessonContentRegistry = createLessonContentRegistry([]);
