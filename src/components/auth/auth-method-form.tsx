"use client";

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
  const message = getCallbackErrorMessage(initialErrorCode);
  const safeReturnTo = resolveSafeReturnPath(returnTo, "/learn");
  const copy = authActionCopy[intent];
  const startQuery = new URLSearchParams({ intent, next: safeReturnTo });
  const startHref = `/auth/google?${startQuery.toString()}`;

  function rememberSignUpReturnPath() {
    if (intent === "sign-up") {
      writeAuthReturnPath(safeReturnTo);
    }
  }

  return (
    <div className="auth-methods">
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

      {configured ? (
        <a
          className="auth-google-button"
          href={startHref}
          onClick={rememberSignUpReturnPath}
        >
          <span className="auth-google-mark" aria-hidden="true">G</span>
          <span>{copy}</span>
        </a>
      ) : (
        <button className="auth-google-button" type="button" disabled>
          <span className="auth-google-mark" aria-hidden="true">G</span>
          <span>{copy}</span>
        </button>
      )}

      <p className="auth-privacy-note">
        We only request your basic Google profile and email address.
      </p>
    </div>
  );
}
