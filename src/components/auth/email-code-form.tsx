"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";

import {
  classifyAuthError,
  clearPendingAuthAttempt,
  maskEmail,
  parsePendingAuthAttempt,
  readPendingAuthSnapshot,
  writeAuthReturnPath,
} from "@/components/auth/auth-utils";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const RESEND_COOLDOWN_MS = 60_000;

function subscribeToPendingAuth() {
  return () => {};
}

export function EmailCodeForm() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const supabase = useMemo(() => createClient(), []);
  const pendingSnapshot = useSyncExternalStore(
    subscribeToPendingAuth,
    readPendingAuthSnapshot,
    () => "",
  );
  const pending = useMemo(
    () => parsePendingAuthAttempt(pendingSnapshot),
    [pendingSnapshot],
  );
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [lastSentAt, setLastSentAt] = useState(0);

  const startAgainHref = pending?.intent === "sign-up" ? "/sign-up" : "/sign-in";

  const verifyCode = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (!pending) {
      setMessage("This verification request is missing or has expired. Start again.");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setMessage("Enter all 6 digits from the email.");
      return;
    }

    if (!configured || !supabase) {
      setMessage("Account access is not connected in this environment yet.");
      return;
    }

    setIsVerifying(true);

    const { error } = await supabase.auth.verifyOtp({
      email: pending.email,
      token: code,
      type: "email",
    });

    if (error) {
      setMessage(
        classifyAuthError(error) === "network"
          ? "We could not reach the account service. Check your connection and try again."
          : "That code is not valid or has expired. Check the email or request a new code.",
      );
      setIsVerifying(false);
      return;
    }

    clearPendingAuthAttempt();

    if (pending.intent === "sign-up") {
      writeAuthReturnPath(pending.next);
      router.replace("/account/welcome");
    } else {
      router.replace(pending.next);
    }

    router.refresh();
  }, [code, configured, pending, router, supabase]);

  async function resendCode() {
    setMessage("");

    if (!pending) {
      setMessage("This verification request is missing or has expired. Start again.");
      return;
    }

    if (Date.now() - Math.max(lastSentAt, pending.createdAt) < RESEND_COOLDOWN_MS) {
      setMessage("A new code was already requested. Wait one minute before trying again.");
      return;
    }

    if (!configured || !supabase) {
      setMessage("Account access is not connected in this environment yet.");
      return;
    }

    setIsResending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: pending.email,
      options: {
        shouldCreateUser: pending.intent === "sign-up",
      },
    });

    if (error && classifyAuthError(error) !== "masked") {
      const errorType = classifyAuthError(error);
      setMessage(
        errorType === "rate-limit"
          ? "Too many code requests. Wait a minute, then try again."
          : errorType === "network"
            ? "We could not reach the account service. Check your connection and try again."
            : "We could not send another code. Please try again.",
      );
      setIsResending(false);
      return;
    }

    setLastSentAt(Date.now());
    setMessage("If this email can continue, a new code is on its way.");
    setIsResending(false);
  }

  if (!pendingSnapshot) {
    return (
      <div className="auth-verification-loading" role="status">
        <span aria-hidden="true" />
        <p>Checking the verification request...</p>
      </div>
    );
  }

  if (!pending) {
    return (
      <div className="auth-missing-attempt">
        <p role="alert">
          This verification request is missing or has expired. Your guest progress is unchanged.
        </p>
        <Link className="button button-primary" href={startAgainHref}>
          Start again
        </Link>
      </div>
    );
  }

  const busy = isVerifying || isResending;

  return (
    <form className="auth-code-form" onSubmit={verifyCode} aria-busy={busy} noValidate>
      <div className="auth-code-destination" aria-live="polite">
        <span>Code sent to</span>
        <strong>{maskEmail(pending.email)}</strong>
      </div>

      <div className="auth-field auth-code-field">
        <label htmlFor="email-code">6-digit code</label>
        <input
          id="email-code"
          name="code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          autoComplete="one-time-code"
          value={code}
          disabled={busy}
          aria-describedby={`email-code-help${message ? " email-code-message" : ""}`}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
        />
        <p id="email-code-help" className="auth-field-help">
          Paste or type the code from the latest email.
        </p>
      </div>

      {message ? (
        <p
          id="email-code-message"
          className={message.includes("on its way") ? "auth-message auth-message-success" : "auth-message auth-message-error"}
          role={message.includes("on its way") ? "status" : "alert"}
        >
          {message}
        </p>
      ) : null}

      <button className="button button-primary auth-submit-button" type="submit" disabled={busy}>
        {isVerifying ? "Verifying..." : "Verify email"}
      </button>

      <div className="auth-code-actions">
        <button type="button" disabled={busy} onClick={resendCode}>
          {isResending ? "Sending..." : "Send a new code"}
        </button>
        <Link href={startAgainHref}>Use a different email</Link>
      </div>
    </form>
  );
}
