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
  PROGRESS_SYNC_REQUEST_LIMIT_BYTES,
  parseProgressSyncRequest,
} from "@/lib/progress-api";
import { FOUNDATION_CURRICULUM_VERSION } from "@/lib/progress-manifest";

const privateJson = (body: unknown, init?: ResponseInit) => {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
};

const authError = (reason: "auth-unavailable" | "unauthenticated" | "unverified-email") => {
  if (reason === "auth-unavailable") {
    return privateJson({ error: "Progress sync is not configured." }, { status: 503 });
  }
  if (reason === "unverified-email") {
    return privateJson({ error: "Verify your email before syncing progress." }, { status: 403 });
  }
  return privateJson({ error: "Sign in to sync progress." }, { status: 401 });
};

export async function GET() {
  const auth = await getVerifiedAuth();
  if (!auth.ok) return authError(auth.reason);

  const { data, error } = await auth.supabase
    .from("learner_course_progress")
    .select("payload, revision, course_epoch, updated_at")
    .eq("user_id", auth.user.id)
    .eq("course_slug", FOUNDATIONS_COURSE_SLUG)
    .maybeSingle();

  if (error) {
    return privateJson({ error: "Progress could not be loaded." }, { status: 500 });
  }

  return privateJson({
    progress: data?.payload ?? null,
    revision: data?.revision ?? 0,
    courseEpoch: data?.course_epoch ?? 0,
    updatedAt: data?.updated_at ?? null,
  });
}

export async function PUT(request: Request) {
  if (!isSameOriginMutation(request)) {
    return privateJson({ error: "Invalid request origin." }, { status: 403 });
  }
  if (!hasJsonContentType(request)) {
    return privateJson({ error: "Expected a JSON request." }, { status: 415 });
  }
  if (!isBodyWithinLimit(request, PROGRESS_SYNC_REQUEST_LIMIT_BYTES)) {
    return privateJson({ error: "Progress request is too large." }, { status: 413 });
  }

  const idempotencyKey = request.headers.get("idempotency-key");
  if (!isUuid(idempotencyKey)) {
    return privateJson({ error: "A valid idempotency key is required." }, { status: 400 });
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > PROGRESS_SYNC_REQUEST_LIMIT_BYTES) {
    return privateJson({ error: "Progress request is too large." }, { status: 413 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return privateJson({ error: "Progress request is invalid." }, { status: 400 });
  }

  const input = parseProgressSyncRequest(json);
  if (!input) {
    return privateJson({ error: "Progress request failed validation." }, { status: 400 });
  }

  const auth = await getVerifiedAuth();
  if (!auth.ok) return authError(auth.reason);

  const { data, error } = await auth.supabase.rpc("commit_progress_document", {
    p_course_slug: FOUNDATIONS_COURSE_SLUG,
    p_curriculum_version: FOUNDATION_CURRICULUM_VERSION,
    p_expected_revision: input.baseRevision,
    p_expected_course_epoch: input.courseEpoch,
    p_idempotency_key: idempotencyKey,
    p_payload: input.payload,
  });

  if (error) {
    return privateJson({ error: "Progress could not be synced." }, { status: 400 });
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result) {
    return privateJson({ error: "Progress sync returned no result." }, { status: 500 });
  }

  return privateJson(
    {
      status: result.sync_status,
      revision: result.revision,
      courseEpoch: result.course_epoch,
      progress: result.payload,
    },
    { status: result.sync_status === "conflict" ? 409 : 200 },
  );
}
