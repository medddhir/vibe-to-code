import type { LessonContentDefinition } from "@/data/lesson-schema";
import { assertValidLessonContentDefinition } from "@/lib/lesson-validation";

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Reflect.ownKeys(value).forEach((key) => deepFreeze((value as Record<PropertyKey, unknown>)[key]));
    Object.freeze(value);
  }
  return value;
}

function immutableContent(definition: LessonContentDefinition) {
  return deepFreeze(structuredClone(definition)) as Readonly<LessonContentDefinition>;
}

export function createLessonContentRegistry(
  definitions: readonly LessonContentDefinition[],
) {
  const bySlug = new Map<string, Readonly<LessonContentDefinition>>();
  definitions.forEach((definition) => {
    assertValidLessonContentDefinition(definition);
    if (bySlug.has(definition.lessonSlug)) {
      throw new Error(`Duplicate trusted lesson content slug: ${definition.lessonSlug}`);
    }
    bySlug.set(definition.lessonSlug, immutableContent(definition));
  });
  const all = Object.freeze([...bySlug.values()]);
  return Object.freeze({
    all: () => all,
    bySlug: (lessonSlug: string) => bySlug.get(lessonSlug) ?? null,
  });
}

/** No data-driven lesson content is trusted or published in this architecture PR. */
export const lessonContentRegistry = createLessonContentRegistry([]);
