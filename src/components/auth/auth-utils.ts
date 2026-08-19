import { resolveSafeReturnPath } from "@/lib/supabase/return-path";

export type AuthIntent = "sign-in" | "sign-up";

export type PendingAuthAttempt = {
  createdAt: number;
  email: string;
  intent: AuthIntent;
  next: string;
};

export type AuthUiError =
  | "generic"
  | "masked"
  | "network"
  | "rate-limit";

export const PENDING_AUTH_STORAGE_KEY = "vibe-to-code:auth-pending:v1";
export const AUTH_RETURN_STORAGE_KEY = "vibe-to-code:auth-return:v1";

const PENDING_AUTH_MAX_AGE_MS = 30 * 60 * 1_000;

export function normalizeEmail(value: string) {
  return value.trim();
}

export function isPlausibleEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function writePendingAuthAttempt(attempt: PendingAuthAttempt) {
  try {
    sessionStorage.setItem(PENDING_AUTH_STORAGE_KEY, JSON.stringify(attempt));
    return true;
  } catch {
    return false;
  }
}

export function readPendingAuthSnapshot() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return sessionStorage.getItem(PENDING_AUTH_STORAGE_KEY) ?? "missing";
  } catch {
    return "missing";
  }
}

export function parsePendingAuthAttempt(value: string): PendingAuthAttempt | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<PendingAuthAttempt>;
    const email = typeof parsed.email === "string" ? normalizeEmail(parsed.email) : "";
    const intent = parsed.intent;
    const createdAt = parsed.createdAt;

    if (
      !isPlausibleEmail(email) ||
      (intent !== "sign-in" && intent !== "sign-up") ||
      typeof createdAt !== "number" ||
      !Number.isFinite(createdAt) ||
      createdAt > Date.now() + 60_000 ||
      Date.now() - createdAt > PENDING_AUTH_MAX_AGE_MS
    ) {
      return null;
    }

    return {
      createdAt,
      email,
      intent,
      next: resolveSafeReturnPath(parsed.next, "/learn"),
    };
  } catch {
    return null;
  }
}

export function clearPendingAuthAttempt() {
  try {
    sessionStorage.removeItem(PENDING_AUTH_STORAGE_KEY);
  } catch {
    // A blocked storage API should not prevent a verified session from continuing.
  }
}

export function writeAuthReturnPath(next: string) {
  try {
    sessionStorage.setItem(
      AUTH_RETURN_STORAGE_KEY,
      resolveSafeReturnPath(next, "/courses/foundations"),
    );
  } catch {
    // The welcome page has a safe Foundations fallback when storage is unavailable.
  }
}

export function readAuthReturnSnapshot() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return sessionStorage.getItem(AUTH_RETURN_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function clearAuthReturnPath() {
  try {
    sessionStorage.removeItem(AUTH_RETURN_STORAGE_KEY);
  } catch {
    // Clearing a convenience return path is best effort only.
  }
}

type AuthErrorLike = {
  code?: string;
  message?: string;
  status?: number;
};

export function classifyAuthError(error: AuthErrorLike): AuthUiError {
  const fingerprint = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();

  if (
    error.status === 429 ||
    fingerprint.includes("rate limit") ||
    fingerprint.includes("rate_limit") ||
    fingerprint.includes("too many requests")
  ) {
    return "rate-limit";
  }

  if (
    fingerprint.includes("failed to fetch") ||
    fingerprint.includes("network") ||
    fingerprint.includes("load failed")
  ) {
    return "network";
  }

  if (
    fingerprint.includes("user not found") ||
    fingerprint.includes("user_not_found") ||
    fingerprint.includes("signup") ||
    fingerprint.includes("already registered") ||
    fingerprint.includes("email exists")
  ) {
    return "masked";
  }

  return "generic";
}

export function getCallbackErrorMessage(code?: string) {
  switch (code) {
    case "auth_unavailable":
      return "Account access is not connected in this environment yet.";
    case "identity_verification":
      return "We could not verify that identity. Please start the sign-in again.";
    case "oauth_callback":
      return "Google sign-in did not finish. Please try again.";
    case "oauth_start":
      return "Google sign-in could not start. Please try again.";
    default:
      return "";
  }
}

export function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return email;
  }

  const visible = localPart.slice(0, Math.min(2, localPart.length));
  return `${visible}${"•".repeat(Math.max(2, Math.min(5, localPart.length - visible.length)))}@${domain}`;
}
