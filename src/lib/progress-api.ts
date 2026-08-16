import { z } from "zod";

import {
  FOUNDATION_CURRICULUM_VERSION,
  FOUNDATION_PROGRESS_LESSON_ORDER,
} from "@/lib/progress-manifest";
import {
  MAX_CANONICAL_PROGRESS_BYTES,
  parseCanonicalFoundationProgress,
  type CanonicalFoundationProgress,
} from "@/lib/progress-sync";

export const PROGRESS_SYNC_REQUEST_LIMIT_BYTES = MAX_CANONICAL_PROGRESS_BYTES + 8_192;
export const FOUNDATIONS_COURSE_SLUG = "foundations";

export const progressSyncRequestSchema = z.object({
  baseRevision: z.number().int().nonnegative().max(1_000_000_000),
  courseEpoch: z.number().int().nonnegative().max(1_000_000_000),
  source: z.enum(["legacy-v1-import", "local-v2", "retry"]),
  payload: z.unknown(),
}).strict();

export const progressResetRequestSchema = z.discriminatedUnion("scope", [
  z.object({ scope: z.literal("course") }).strict(),
  z.object({
    scope: z.literal("lesson"),
    lessonSlug: z.enum(FOUNDATION_PROGRESS_LESSON_ORDER as [string, ...string[]]),
  }).strict(),
]);

export type ProgressSyncRequest = {
  baseRevision: number;
  courseEpoch: number;
  source: "legacy-v1-import" | "local-v2" | "retry";
  payload: CanonicalFoundationProgress;
};

function hasCurrentCurriculumVersion(payload: unknown) {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return false;
  }

  const descriptor = Object.getOwnPropertyDescriptor(payload, "curriculumVersion");
  return Boolean(
    descriptor &&
    "value" in descriptor &&
    descriptor.value === FOUNDATION_CURRICULUM_VERSION,
  );
}

export function parseProgressSyncRequest(input: unknown): ProgressSyncRequest | null {
  const parsed = progressSyncRequestSchema.safeParse(input);
  if (!parsed.success) return null;

  // Trusted caches and GET normalization may upgrade v2, but mutation requests
  // must already speak the current curriculum contract.
  if (!hasCurrentCurriculumVersion(parsed.data.payload)) return null;

  try {
    const payload = parseCanonicalFoundationProgress(parsed.data.payload);
    if (
      payload.revision !== parsed.data.baseRevision ||
      payload.courseEpoch !== parsed.data.courseEpoch ||
      payload.curriculumVersion !== FOUNDATION_CURRICULUM_VERSION
    ) {
      return null;
    }

    return { ...parsed.data, payload };
  } catch {
    return null;
  }
}
