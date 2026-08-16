import type { LessonContentDefinition } from "@/data/lesson-schema";

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
  const all = Object.freeze(definitions.map(immutableContent));
  return Object.freeze({
    all: () => all,
    bySlug: (lessonSlug: string) =>
      all.find((definition) => definition.lessonSlug === lessonSlug) ?? null,
  });
}

/** No data-driven lesson content is trusted or published in this architecture PR. */
export const lessonContentRegistry = createLessonContentRegistry([]);
