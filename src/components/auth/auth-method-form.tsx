"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import {
  classifyAuthError,
  getCallbackErrorMessage,
  isPlausibleEmail,
  normalizeEmail,
  type AuthIntent,
  writeAuthReturnPath,
  writePendingAuthAttempt,
} from "@/components/auth/auth-utils";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resolveSafeReturnPath } from "@/lib/supabase/return-path";

type AuthMethodFormProps = {
  initialErrorCode?: string;
  intent: AuthIntent;
  returnTo: string;
};

type PendingMethod = "email" | "google" | null;

const authActionCopy = {
  "sign-in": {
    email: "Continue with email",
    google: "Continue with Google",
  },
  "sign-up": {
    email: "Create account with email",
    google: "Create account with Google",
  },
} satisfies Record<AuthIntent, Record<"email" | "google", string>>;

export function AuthMethodForm({
  initialErrorCode,
  intent,
  returnTo,
}: AuthMethodFormProps) {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [pendingMethod, setPendingMethod] = useState<PendingMethod>(null);
  const [message, setMessage] = useState(() => getCallbackErrorMessage(initialErrorCode));
  const [emailError, setEmailError] = useState("");
  const safeReturnTo = resolveSafeReturnPath(returnTo, "/learn");
  const copy = authActionCopy[intent];
  const isBusy = pendingMethod !== null;

  function savePendingAttempt(normalizedEmail: string) {
    return writePendingAuthAttempt({
      createdAt: Date.now(),
      email: normalizedEmail,
      intent,
      next: safeReturnTo,
    });
  }

  async function continueWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setEmailError("");

    const normalizedEmail = normalizeEmail(email);

    if (!isPlausibleEmail(normalizedEmail)) {
      setEmailError("Enter a complete email address, such as name@example.com.");
      return;
    }

    if (!configured || !supabase) {
      setMessage("Account access is not connected in this environment yet.");
      return;
    }

    setPendingMethod("email");

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: intent === "sign-up",
      },
    });

    if (error) {
      const errorType = classifyAuthError(error);

      if (errorType !== "masked") {
        setMessage(
          errorType === "rate-limit"
            ? "Too many code requests. Wait a minute, then try again."
            : errorType === "network"
              ? "We could not reach the account service. Check your connection and try again."
              : "We could not start email access. Please try again.",
        );
        setPendingMethod(null);
        return;
      }
    }

    if (!savePendingAttempt(normalizedEmail)) {
      setMessage(
        "This browser blocked temporary storage. Allow site storage, then request the code again.",
      );
      setPendingMethod(null);
      return;
    }

    router.push("/verify-email");
  }

  async function continueWithGoogle() {
    setMessage("");
    setEmailError("");

    if (!configured || !supabase) {
      setMessage("Account access is not connected in this environment yet.");
      return;
    }

    setPendingMethod("google");

    const callbackNext = intent === "sign-up" ? "/account/welcome" : safeReturnTo;

    if (intent === "sign-up") {
      writeAuthReturnPath(safeReturnTo);
    }

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", callbackNext);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      const errorType = classifyAuthError(error);
      setMessage(
        errorType === "network"
          ? "We could not reach Google sign-in. Check your connection and try again."
          : "Google sign-in could not start. Please try again.",
      );
      setPendingMethod(null);
    }
  }

  return (
    <div className="auth-methods" aria-busy={isBusy}>
      {!configured ? (
        <div className="auth-config-notice" role="status">
          <strong>Account setup is not connected here yet.</strong>
          <p>You can keep learning as a guest while staging credentials are added.</p>
        </div>
      ) : null}

      {message ? (
        <p className="auth-message auth-message-error" role="alert">
          {message}
        </p>
      ) : null}

      <button
        className="auth-google-button"
        type="button"
        disabled={!configured || isBusy}
        onClick={continueWithGoogle}
      >
        <span className="auth-google-mark" aria-hidden="true">G</span>
        <span>{pendingMethod === "google" ? "Opening Google..." : copy.google}</span>
      </button>

      <div className="auth-divider" aria-hidden="true">
        <span>or use email</span>
      </div>

      <form className="auth-email-form" onSubmit={continueWithEmail} noValidate>
        <div className="auth-field">
          <label htmlFor={`${intent}-email`}>Email address</label>
          <input
            id={`${intent}-email`}
            name="email"
            type="email"
            inputMode="email"
            maxLength={254}
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            disabled={!configured || isBusy}
            aria-invalid={Boolean(emailError)}
            aria-describedby={`${intent}-email-help${emailError ? ` ${intent}-email-error` : ""}`}
            onChange={(event) => setEmail(event.target.value)}
          />
          <p id={`${intent}-email-help`} className="auth-field-help">
            We will email you a 6-digit code. No password required.
          </p>
          {emailError ? (
            <p id={`${intent}-email-error`} className="auth-field-error" role="alert">
              {emailError}
            </p>
          ) : null}
        </div>

        <button
          className="button button-primary auth-submit-button"
          type="submit"
          disabled={!configured || isBusy}
        >
          {pendingMethod === "email" ? "Sending code..." : copy.email}
        </button>
      </form>

      <p className="auth-privacy-note">
        Email codes expire. A code only creates a session after successful verification.
      </p>
    </div>
  );
}
