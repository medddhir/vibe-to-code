"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";

import { useAuthUser } from "@/components/auth/use-auth-user";
import { useProgressSync } from "@/components/progress/progress-sync-provider";

type AccountEntryProps = {
  variant?: "desktop" | "mobile";
};

function getDisplayName(email?: string, fullName?: unknown) {
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim().slice(0, 120);
  }

  return email?.split("@")[0]?.slice(0, 120) || "Learner";
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "VT";
}

function closeClosestMobileMenu(event: ReactMouseEvent<HTMLElement>) {
  event.currentTarget.closest("details.mobile-menu")?.removeAttribute("open");
}

function getProgressSyncLabel(status: ReturnType<typeof useProgressSync>["status"]) {
  switch (status) {
    case "synced":
      return "Progress synced";
    case "syncing":
      return "Syncing progress...";
    case "offline":
      return "Saved here. Sync is offline";
    case "error":
      return "Saved here. Sync needs retry";
    default:
      return "Progress saved on this device";
  }
}

export function AccountEntry({ variant = "desktop" }: AccountEntryProps) {
  const router = useRouter();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const { signOut, status, user } = useAuthUser();
  const progressSync = useProgressSync();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const progressSyncLabel = getProgressSyncLabel(progressSync.status);

  useEffect(() => {
    if (variant !== "desktop") {
      return;
    }

    function closeFromOutside(event: PointerEvent) {
      if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) {
        detailsRef.current.removeAttribute("open");
      }
    }

    function closeFromEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || !detailsRef.current?.open) {
        return;
      }

      detailsRef.current.removeAttribute("open");
      detailsRef.current.querySelector("summary")?.focus();
    }

    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromEscape);

    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromEscape);
    };
  }, [variant]);

  if (status === "unavailable") {
    return null;
  }

  if (status === "loading") {
    return variant === "desktop" ? (
      <span className="account-entry-placeholder" aria-hidden="true" />
    ) : (
      <span className="mobile-account-loading" role="status">Checking account...</span>
    );
  }

  if (status === "error") {
    return variant === "mobile" ? (
      <Link className="mobile-account-link" href="/sign-in" onClick={closeClosestMobileMenu}>Sign in</Link>
    ) : null;
  }

  if (!user) {
    return (
      <Link
        className={variant === "mobile" ? "mobile-account-link" : "header-auth-link"}
        href="/sign-in"
        onClick={variant === "mobile" ? closeClosestMobileMenu : undefined}
      >
        Sign in
      </Link>
    );
  }

  const email = user.email ?? "Verified account";
  const name = getDisplayName(user.email, user.user_metadata.full_name ?? user.user_metadata.name);
  const initials = getInitials(name);

  async function handleSignOut() {
    setIsSigningOut(true);
    const signedOut = await signOut();

    if (signedOut) {
      detailsRef.current?.removeAttribute("open");
      router.push("/");
      router.refresh();
      return;
    }

    setIsSigningOut(false);
  }

  if (variant === "mobile") {
    return (
      <div className="mobile-account-block">
        <div className="mobile-account-identity">
          <span className="account-avatar" aria-hidden="true">{initials}</span>
          <div>
            <strong>{name}</strong>
            <small>{email}</small>
          </div>
        </div>
        <p className="account-sync-caption" role="status" aria-live="polite">
          <i aria-hidden="true" /> {progressSyncLabel}
        </p>
        <Link href="/account" onClick={closeClosestMobileMenu}>Account</Link>
        <button type="button" disabled={isSigningOut} onClick={handleSignOut}>
          {isSigningOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    );
  }

  return (
    <details className="account-entry" ref={detailsRef}>
      <summary aria-label={`Open account menu for ${name}`}>
        <span className="account-avatar" aria-hidden="true">{initials}</span>
        <span className="account-entry-name">{name}</span>
        <span className="account-chevron" aria-hidden="true">⌄</span>
      </summary>
      <div className="account-popover">
        <div className="account-popover-identity">
          <strong>{name}</strong>
          <span>{email}</span>
        </div>
        <p className="account-sync-caption" role="status" aria-live="polite">
          <i aria-hidden="true" /> {progressSyncLabel}
        </p>
        <Link href="/account" onClick={() => detailsRef.current?.removeAttribute("open")}>
          Account
        </Link>
        <button type="button" disabled={isSigningOut} onClick={handleSignOut}>
          {isSigningOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </details>
  );
}
