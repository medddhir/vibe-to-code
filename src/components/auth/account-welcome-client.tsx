"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";

import {
  clearAuthReturnPath,
  readAuthReturnSnapshot,
} from "@/components/auth/auth-utils";
import { useAuthUser } from "@/components/auth/use-auth-user";
import { useProgressSync } from "@/components/progress/progress-sync-provider";
import { resolveSafeReturnPath } from "@/lib/supabase/return-path";

function subscribeToReturnPath() {
  return () => {};
}

export function AccountWelcomeClient() {
  const { status, user } = useAuthUser();
  const progressSync = useProgressSync();
  const storedReturnPath = useSyncExternalStore(
    subscribeToReturnPath,
    readAuthReturnSnapshot,
    () => "",
  );
  const continueHref = useMemo(
    () => resolveSafeReturnPath(storedReturnPath, "/courses/foundations"),
    [storedReturnPath],
  );
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [preferenceStatus, setPreferenceStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  async function updateMarketingPreference(enabled: boolean) {
    setMarketingEnabled(enabled);
    setPreferenceStatus("saving");

    try {
      const response = await fetch("/api/account/email-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketingEnabled: enabled }),
      });

      if (!response.ok) {
        throw new Error("Preference could not be saved");
      }

      setPreferenceStatus("saved");
    } catch {
      setMarketingEnabled(!enabled);
      setPreferenceStatus("error");
    }
  }

  if (status === "loading") {
    return (
      <div className="account-loading" role="status">
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <p>Preparing your account...</p>
      </div>
    );
  }

  if (status === "unavailable" || status === "error") {
    return (
      <div className="account-empty-state">
        <p className="auth-kicker">Account setup</p>
        <h1>We could not open the welcome step.</h1>
        <p>Your guest progress remains safe on this device.</p>
        <Link className="button button-primary" href="/courses/foundations">
          Continue learning
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="account-empty-state">
        <p className="auth-kicker">Account setup</p>
        <h1>Finish signing in first.</h1>
        <p>Your guest progress is still available on this browser.</p>
        <Link className="button button-primary" href="/sign-up">
          Create account
        </Link>
      </div>
    );
  }

  return (
    <div className="account-welcome-layout">
      <div className="account-welcome-mark" aria-hidden="true">✓</div>
      <p className="auth-kicker">Email verified</p>
      <h1>Your account is ready.</h1>
      <p className="account-welcome-lead" role="status" aria-live="polite">
        {progressSync.message}
      </p>

      <div className="account-merge-contract" aria-label="Progress protection rules">
        <div>
          <span>Device copy</span>
          <strong>Kept intact</strong>
        </div>
        <div>
          <span>Merge rule</span>
          <strong>More complete wins</strong>
        </div>
        <div>
          <span>Current status</span>
          <strong>
            {progressSync.status === "synced"
              ? "Synced"
              : progressSync.status === "syncing"
                ? "Syncing"
                : "Device safe"}
          </strong>
        </div>
      </div>

      {progressSync.status === "error" || progressSync.status === "offline" ? (
        <button className="button button-secondary" type="button" onClick={progressSync.retry}>
          Retry sync
        </button>
      ) : null}

      <div className="account-welcome-preference">
        <label className="account-marketing-option">
          <input
            type="checkbox"
            checked={marketingEnabled}
            disabled={preferenceStatus === "saving"}
            onChange={(event) => void updateMarketingPreference(event.target.checked)}
          />
          <span>
            <strong>Email me new lessons and product updates.</strong>
            <small>
              Optional. You can change this later from your account.
            </small>
          </span>
        </label>
        <p
          className={preferenceStatus === "error" ? "auth-message auth-message-error" : "account-preference-status"}
          role={preferenceStatus === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {preferenceStatus === "saving"
            ? "Saving preference..."
            : preferenceStatus === "saved"
              ? "Email preference saved."
              : preferenceStatus === "error"
                ? "The preference was not saved. Please try again."
                : ""}
        </p>
      </div>

      <div className="account-welcome-actions">
        <Link
          className="button button-primary"
          href={continueHref}
          onClick={clearAuthReturnPath}
        >
          Continue learning
        </Link>
        <Link className="button button-secondary" href="/account">
          Open account
        </Link>
      </div>
    </div>
  );
}
