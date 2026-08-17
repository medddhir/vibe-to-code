import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { isStagingCoursePreviewHost } from "@/lib/staging-preview";
import { resolveSafeReturnPath } from "@/lib/supabase/return-path";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PUBLIC_LESSON_PATH = "/lessons/what-is-code";
const LESSON_ROUTE_PREFIX = "/lessons";
const SIGN_IN_ROUTE = "/sign-in";
const DEFAULT_LESSON_FALLBACK = "/learn";

type LessonClaims = {
  app_metadata?: {
    provider?: string;
  };
  iss?: string;
  role?: string;
  sub?: string;
  is_anonymous?: boolean;
};

type LessonAccessClaimsResult = {
  error?: unknown;
  data?: {
    claims?: LessonClaims;
  } | null;
};

export type LessonPathDecision = {
  lessonPath: string;
  isLessonPath: boolean;
  isProtected: boolean;
  signInPath: string | null;
};

export const normalizeLessonPath = (path: string): string => {
  let sanitized = path;

  const questionIndex = sanitized.indexOf("?");
  if (questionIndex >= 0) {
    sanitized = sanitized.slice(0, questionIndex);
  }

  const hashIndex = sanitized.indexOf("#");
  if (hashIndex >= 0) {
    sanitized = sanitized.slice(0, hashIndex);
  }

  if (!sanitized.startsWith("/")) {
    sanitized = `/${sanitized}`;
  }

  sanitized = sanitized.replace(/\/{2,}/g, "/");
  return sanitized.endsWith("/") && sanitized.length > 1
    ? sanitized.replace(/\/+$/, "")
    : sanitized;
};

export const isLessonRoutePath = (path: string): boolean => {
  return normalizeLessonPath(path).startsWith(`${LESSON_ROUTE_PREFIX}/`);
};

export const isPublicLessonRoute = (path: string): boolean => {
  return normalizeLessonPath(path) === PUBLIC_LESSON_PATH;
};

export const isProtectedLessonRoute = (path: string): boolean => {
  const lessonPath = normalizeLessonPath(path);
  return isLessonRoutePath(lessonPath) && !isPublicLessonRoute(lessonPath);
};

export const getLessonPathDecision = (path: string): LessonPathDecision => {
  const lessonPath = normalizeLessonPath(path);
  const isProtected = isProtectedLessonRoute(lessonPath);
  const safeNext = resolveSafeReturnPath(lessonPath, DEFAULT_LESSON_FALLBACK);
  const signInPath = isProtected
    ? `${SIGN_IN_ROUTE}?next=${encodeURIComponent(safeNext)}`
    : null;

  return {
    lessonPath,
    isLessonPath: isLessonRoutePath(lessonPath),
    isProtected,
    signInPath,
  };
};

export const isAuthenticatedGoogleSession = (claims: unknown): boolean => {
  if (!claims || typeof claims !== "object") {
    return false;
  }

  const typed = claims as LessonClaims;

  if (typeof typed.sub !== "string" || typed.sub.length === 0) {
    return false;
  }

  if (typed.role !== "authenticated") {
    return false;
  }

  if (typed.is_anonymous === true) {
    return false;
  }

  const appMetadata = typed.app_metadata;
  if (!appMetadata || typeof appMetadata !== "object") {
    return false;
  }

  return appMetadata.provider === "google";
};

export const isAuthorizedLessonClaims = (
  claimsResult: LessonAccessClaimsResult | null | undefined,
): boolean => {
  if (!claimsResult || claimsResult.error) {
    return false;
  }

  return isAuthenticatedGoogleSession(claimsResult.data?.claims);
};

type LessonAccessOptions = {
  requestHost?: string | null;
};

async function getLessonRequestHost(
  options: LessonAccessOptions,
): Promise<string | null> {
  if (Object.prototype.hasOwnProperty.call(options, "requestHost")) {
    return options.requestHost ?? null;
  }

  try {
    return (await headers()).get("host");
  } catch {
    return null;
  }
}

export async function requireAuthenticatedLessonAccess(
  lessonPath: string,
  options: LessonAccessOptions = {},
): Promise<void> {
  const decision = getLessonPathDecision(lessonPath);

  if (!decision.isProtected || !decision.signInPath) {
    return;
  }

  if (isStagingCoursePreviewHost(await getLessonRequestHost(options))) {
    return;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(decision.signInPath);
  }

  let claimsResult: LessonAccessClaimsResult;

  try {
    claimsResult = await supabase.auth.getClaims();
  } catch {
    redirect(decision.signInPath);
  }

  if (!isAuthorizedLessonClaims(claimsResult)) {
    redirect(decision.signInPath);
  }
}
