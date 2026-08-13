import { NextResponse } from "next/server";

import {
  hasJsonContentType,
  isBodyWithinLimit,
  isSameOriginMutation,
  isUuid,
} from "@/lib/api/request-security";
import { getVerifiedAuth } from "@/lib/auth/verified-user";
import {
  FOUNDATIONS_COURSE_SLUG,
  progressResetRequestSchema,
} from "@/lib/progress-api";
import { FOUNDATION_CURRICULUM_VERSION } from "@/lib/progress-manifest";

const privateJson = (body: unknown, init?: ResponseInit) => {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
};

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return privateJson({ error: "Invalid request origin." }, { status: 403 });
  }
  if (!hasJsonContentType(request) || !isBodyWithinLimit(request, 2048)) {
    return privateJson({ error: "Invalid reset request." }, { status: 415 });
  }

  const idempotencyKey = request.headers.get("idempotency-key");
  if (!isUuid(idempotencyKey)) {
    return privateJson({ error: "A valid idempotency key is required." }, { status: 400 });
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > 2048) {
    return privateJson({ error: "Reset request is too large." }, { status: 413 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return privateJson({ error: "Invalid reset request." }, { status: 400 });
  }

  const input = progressResetRequestSchema.safeParse(json);
  if (!input.success) {
    return privateJson({ error: "Invalid reset request." }, { status: 400 });
  }

  const auth = await getVerifiedAuth();
  if (!auth.ok) {
    const status = auth.reason === "auth-unavailable" ? 503 : auth.reason === "unverified-email" ? 403 : 401;
    return privateJson({ error: "A verified account is required." }, { status });
  }

  const { data, error } = await auth.supabase.rpc("reset_progress_document", {
    p_course_slug: FOUNDATIONS_COURSE_SLUG,
    p_curriculum_version: FOUNDATION_CURRICULUM_VERSION,
    p_scope: input.data.scope,
    p_lesson_slug: input.data.scope === "lesson" ? input.data.lessonSlug : null,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    return privateJson({ error: "Progress could not be reset." }, { status: 400 });
  }

  const result = Array.isArray(data) ? data[0] : data;
  return privateJson({
    status: result?.sync_status ?? "applied",
    revision: result?.revision,
    courseEpoch: result?.course_epoch,
    progress: result?.payload,
  });
}
