import type { LessonContentDefinition } from "@/data/lesson-schema";
import { boxModelLayoutResponsiveDesignLesson } from "@/data/lessons/foundations/box-model-layout-responsive-design";
import { browserDeveloperToolsLesson } from "@/data/lessons/foundations/browser-developer-tools";
import { cssSelectorsColourSpacingCascadeLesson } from "@/data/lessons/foundations/css-selectors-colour-spacing-cascade";
import { firstHtmlDocumentLesson } from "@/data/lessons/foundations/first-html-document";
import { internetWebBrowserServerLesson } from "@/data/lessons/foundations/internet-web-browser-server";
import { javascriptDomEventsLesson } from "@/data/lessons/foundations/javascript-dom-events";
import { meaningfulHtmlTextLinksImagesControlsLesson } from "@/data/lessons/foundations/meaningful-html-text-links-images-controls";
import { requestsResponsesHttpHttpsLesson } from "@/data/lessons/foundations/requests-responses-http-https";
import { urlsDomainsDnsPathsQueriesLesson } from "@/data/lessons/foundations/urls-domains-dns-paths-queries";
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

export const lessonContentRegistry = createLessonContentRegistry([
  internetWebBrowserServerLesson,
  urlsDomainsDnsPathsQueriesLesson,
  requestsResponsesHttpHttpsLesson,
  browserDeveloperToolsLesson,
  firstHtmlDocumentLesson,
  meaningfulHtmlTextLinksImagesControlsLesson,
  cssSelectorsColourSpacingCascadeLesson,
  boxModelLayoutResponsiveDesignLesson,
  javascriptDomEventsLesson,
]);
