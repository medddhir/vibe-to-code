import { NextResponse } from "next/server";
import { z } from "zod";

import {
  hasJsonContentType,
  isBodyWithinLimit,
  isSameOriginMutation,
} from "@/lib/api/request-security";
import { getVerifiedAuth } from "@/lib/auth/verified-user";

const preferenceSchema = z.object({
  marketingEnabled: z.boolean(),
}).strict();

const privateJson = (body: unknown, init?: ResponseInit) => {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
};

const authError = (reason: "auth-unavailable" | "unauthenticated" | "unverified-email") => {
  if (reason === "auth-unavailable") {
    return privateJson({ error: "Accounts are not configured." }, { status: 503 });
  }

  if (reason === "unverified-email") {
    return privateJson({ error: "Verify your email before saving preferences." }, { status: 403 });
  }

  return privateJson({ error: "Sign in to view email preferences." }, { status: 401 });
};

export async function GET() {
  const auth = await getVerifiedAuth();

  if (!auth.ok) {
    return authError(auth.reason);
  }

  const { data, error } = await auth.supabase
    .from("email_preferences")
    .select("marketing_enabled, consented_at, revoked_at, updated_at")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) {
    return privateJson({ error: "Email preferences could not be loaded." }, { status: 500 });
  }

  return privateJson({
    marketingEnabled: data?.marketing_enabled ?? false,
    consentedAt: data?.consented_at ?? null,
    revokedAt: data?.revoked_at ?? null,
    updatedAt: data?.updated_at ?? null,
  });
}

export async function PUT(request: Request) {
  if (!isSameOriginMutation(request)) {
    return privateJson({ error: "Invalid request origin." }, { status: 403 });
  }

  if (!hasJsonContentType(request) || !isBodyWithinLimit(request, 2048)) {
    return privateJson({ error: "Invalid request body." }, { status: 415 });
  }

  const rawBody = await request.text();

  if (new TextEncoder().encode(rawBody).byteLength > 2048) {
    return privateJson({ error: "Invalid request body." }, { status: 413 });
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return privateJson({ error: "Invalid request body." }, { status: 400 });
  }

  const input = preferenceSchema.safeParse(parsedBody);
  if (!input.success) {
    return privateJson({ error: "Invalid email preference." }, { status: 400 });
  }

  const auth = await getVerifiedAuth();
  if (!auth.ok) {
    return authError(auth.reason);
  }

  const { data, error } = await auth.supabase.rpc(
    "set_email_marketing_preference",
    { p_enabled: input.data.marketingEnabled },
  );

  const result = Array.isArray(data) ? data[0] : data;

  if (error || !result) {
    return privateJson({ error: "Email preferences could not be saved." }, { status: 500 });
  }

  return privateJson({
    marketingEnabled: result.marketing_enabled,
    consentedAt: result.consented_at,
    revokedAt: result.revoked_at,
    updatedAt: result.updated_at,
  });
}
