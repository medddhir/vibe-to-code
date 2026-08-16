"use client";

import { useMemo, useState } from "react";

import {
  classifyAuthError,
  getCallbackErrorMessage,
  type AuthIntent,
  writeAuthReturnPath,
} from "@/components/auth/auth-utils";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resolveSafeReturnPath } from "@/lib/supabase/return-path";

type AuthMethodFormProps = {
  initialErrorCode?: string;
  intent: AuthIntent;
  returnTo: string;
};

const authActionCopy = {
  "sign-in": "Continue with Google",
  "sign-up": "Create account with Google",
} satisfies Record<AuthIntent, string>;

export function AuthMethodForm({
  initialErrorCode,
  intent,
  returnTo,
}: AuthMethodFormProps) {
  const configured = isSupabaseConfigured();
  const supabase = useMemo(() => createClient(), []);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState(() => getCallbackErrorMessage(initialErrorCode));
  const safeReturnTo = resolveSafeReturnPath(returnTo, "/learn");
  const copy = authActionCopy[intent];

  async function continueWithGoogle() {
    setMessage("");

    if (!configured || !supabase) {
      setMessage("Account access is not connected in this environment yet.");
      return;
    }

    setIsPending(true);

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
      setIsPending(false);
    }
  }

  return (
    <div className="auth-methods" aria-busy={isPending}>
      {!configured ? (
        <div className="auth-config-notice" role="status">
          <strong>Account setup is not connected here yet.</strong>
          <p>Lesson 1 is still available. Account-only lessons are unavailable until this environment is connected.</p>
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
        disabled={!configured || isPending}
        onClick={continueWithGoogle}
      >
        <span className="auth-google-mark" aria-hidden="true">G</span>
        <span>{isPending ? "Opening Google..." : copy}</span>
      </button>

      <p className="auth-privacy-note">
        We only request your basic Google profile and email address.
      </p>
    </div>
  );
}
