"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthUser } from "@/components/auth/use-auth-user";
import { useProgressSync } from "@/components/progress/progress-sync-provider";

function LoadingAccount() {
  return (
    <div className="account-loading" role="status">
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <p>Checking your account...</p>
    </div>
  );
}

function AccountUnavailable({ error = false }: { error?: boolean }) {
  return (
    <div className="account-empty-state">
      <p className="auth-kicker">Account access</p>
      <h1>{error ? "We could not check your session." : "Account setup is not connected here yet."}</h1>
      <p>
        Your local learning progress is unchanged. You can continue every public lesson as a guest.
      </p>
      <Link className="button button-primary" href="/courses/foundations">
        Continue learning
      </Link>
    </div>
  );
}

export function AccountPageClient() {
  const router = useRouter();
  const { signOut, status, user } = useAuthUser();
  const progressSync = useProgressSync();
  const userId = user?.id;
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [preferenceStatus, setPreferenceStatus] = useState<
    "loading" | "idle" | "saving" | "saved" | "error"
  >("loading");

  useEffect(() => {
    if (!userId) {
      return;
    }

    let active = true;
    void fetch("/api/account/email-preferences", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Preference could not be loaded");
        return response.json() as Promise<{ marketingEnabled?: boolean }>;
      })
      .then((preference) => {
        if (!active) return;
        setMarketingEnabled(preference.marketingEnabled === true);
        setPreferenceStatus("idle");
      })
      .catch(() => {
        if (active) setPreferenceStatus("error");
      });

    return () => {
      active = false;
    };
  }, [userId]);

  if (status === "loading") {
    return <LoadingAccount />;
  }

  if (status === "unavailable") {
    return <AccountUnavailable />;
  }

  if (status === "error") {
    return <AccountUnavailable error />;
  }

  if (!user) {
    return (
      <div className="account-empty-state">
        <p className="auth-kicker">Your account</p>
        <h1>Sign in to open your account.</h1>
        <p>Guest progress remains on this browser until you decide to connect it.</p>
        <Link className="button button-primary" href="/sign-in?next=/account">
          Sign in
        </Link>
      </div>
    );
  }

  const email = user.email ?? "No email available";
  const rawDisplayName =
    (typeof user.user_metadata.full_name === "string" && user.user_metadata.full_name.trim()) ||
    (typeof user.user_metadata.name === "string" && user.user_metadata.name.trim()) ||
    email.split("@")[0] ||
    "Learner";
  const displayName = rawDisplayName.slice(0, 120);
  const provider = typeof user.app_metadata.provider === "string"
    ? user.app_metadata.provider
    : "email";
  const emailVerified = Boolean(user.email_confirmed_at);

  async function handleSignOut() {
    setIsSigningOut(true);
    const signedOut = await signOut();

    if (signedOut) {
      router.push("/");
      router.refresh();
      return;
    }

    setIsSigningOut(false);
  }

  async function updateMarketingPreference(enabled: boolean) {
    setMarketingEnabled(enabled);
    setPreferenceStatus("saving");

    try {
      const response = await fetch("/api/account/email-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketingEnabled: enabled }),
      });

      if (!response.ok) throw new Error("Preference could not be saved");
      setPreferenceStatus("saved");
    } catch {
      setMarketingEnabled(!enabled);
      setPreferenceStatus("error");
    }
  }

  return (
    <div className="account-layout">
      <header className="account-page-header">
        <p className="auth-kicker">Your account</p>
        <h1>Good to have you here, {displayName}.</h1>
        <p>Manage your verified identity and see how learning progress is stored.</p>
      </header>

      <section className="account-section" aria-labelledby="account-identity-title">
        <div className="account-section-heading">
          <span>Identity</span>
          <h2 id="account-identity-title">Account details</h2>
        </div>
        <dl className="account-detail-list">
          <div>
            <dt>Email</dt>
            <dd>{email}</dd>
          </div>
          <div>
            <dt>Verification</dt>
            <dd className={emailVerified ? "is-positive" : undefined}>
              {emailVerified ? "Verified" : "Pending"}
            </dd>
          </div>
          <div>
            <dt>Sign-in method</dt>
            <dd>{provider === "google" ? "Google" : "Email code"}</dd>
          </div>
        </dl>
      </section>

      <section className="account-section account-sync-section" aria-labelledby="account-sync-title">
        <div className="account-section-heading">
          <span>Learning continuity</span>
          <h2 id="account-sync-title">Progress status</h2>
        </div>
        <div className="account-sync-state" role="status" aria-live="polite">
          <span><i aria-hidden="true" /> {progressSync.status === "synced" ? "Account progress synced" : "Device copy protected"}</span>
          <p>{progressSync.message}</p>
          <small>Cloud sync combines completed lessons, practice work, attempts, hints, and bounded saved code without replacing a more complete copy.</small>
        </div>
        <div className="account-sync-actions">
          <Link className="button button-secondary" href="/courses/foundations">
            Open learning path
          </Link>
          {progressSync.status === "error" || progressSync.status === "offline" ? (
            <button className="button button-secondary" type="button" onClick={progressSync.retry}>
              Retry sync
            </button>
          ) : null}
        </div>
      </section>

      <section className="account-section" aria-labelledby="account-email-title">
        <div className="account-section-heading">
          <span>Optional updates</span>
          <h2 id="account-email-title">Email preferences</h2>
        </div>
        <label className="account-marketing-option">
          <input
            type="checkbox"
            checked={marketingEnabled}
            disabled={preferenceStatus === "loading" || preferenceStatus === "saving"}
            onChange={(event) => void updateMarketingPreference(event.target.checked)}
          />
          <span>
            <strong>Email me new lessons and product updates.</strong>
            <small>Optional marketing email. Authentication messages are sent separately.</small>
          </span>
        </label>
        <p
          className={preferenceStatus === "error" ? "auth-message auth-message-error" : "account-preference-status"}
          role={preferenceStatus === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {preferenceStatus === "loading"
            ? "Loading preference..."
            : preferenceStatus === "saving"
              ? "Saving preference..."
              : preferenceStatus === "saved"
                ? "Email preference saved."
                : preferenceStatus === "error"
                  ? "The preference could not be loaded or saved. Try again."
                  : ""}
        </p>
      </section>

      <div className="account-sign-out-row">
        <p>Signing out does not erase learning progress stored on this device.</p>
        <button className="button button-secondary" type="button" disabled={isSigningOut} onClick={handleSignOut}>
          {isSigningOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </div>
  );
}
