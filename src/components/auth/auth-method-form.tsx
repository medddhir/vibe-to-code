"use client";

import { useState } from "react";

import {
  getCallbackErrorMessage,
  type AuthIntent,
  writeAuthReturnPath,
} from "@/components/auth/auth-utils";
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
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState(() => getCallbackErrorMessage(initialErrorCode));
  const safeReturnTo = resolveSafeReturnPath(returnTo, "/learn");
  const copy = authActionCopy[intent];

  async function continueWithGoogle() {
    setMessage("");

    if (!configured) {
      setMessage("Account access is not connected in this environment yet.");
      return;
    }

    setIsPending(true);

    if (intent === "sign-up") {
      writeAuthReturnPath(safeReturnTo);
    }

    const startUrl = new URL("/auth/google", window.location.origin);
    startUrl.searchParams.set("intent", intent);
    startUrl.searchParams.set("next", safeReturnTo);
    window.location.assign(startUrl.toString());
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
