"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAuthUser } from "@/components/auth/use-auth-user";
import {
  resetCourseProgress as resetLocalCourseProgress,
  resetLessonProgress as resetLocalLessonProgress,
} from "@/lib/course-progress";
import {
  getFoundationProgressLessonManifest,
  type FoundationProgressLessonSlug,
} from "@/lib/progress-manifest";
import {
  applyAcknowledgedFoundationProgressReset,
  canProjectFoundationProgressForPrincipal,
  canonicalFoundationProgressDocumentsMatch,
  convertLegacyFoundationProgress,
  createEmptyCanonicalFoundationProgress,
  createLegacyImportFingerprint,
  getLegacyImportFingerprintStorageKey,
  mergeCanonicalFoundationProgress,
  normalizeCanonicalFoundationProgress,
  reconcileCanonicalFoundationProgressCheckpoint,
  reconcileCanonicalFoundationProgressWithServer,
  subtractClaimedGuestProgress,
  type CanonicalFoundationProgress,
  type FoundationProgressResetScope,
} from "@/lib/progress-sync";
import {
  applyCanonicalFoundationProgressToLegacyStores,
  collectLegacyFoundationProgressFromStorage,
  getOrCreateProgressDeviceId,
  readCanonicalProgressCache,
  writeCanonicalProgressCache,
} from "@/lib/progress-sync-storage";
import { isProgressSyncEnabled } from "@/lib/supabase/config";

export type ProgressSyncStatus =
  | "device-only"
  | "syncing"
  | "synced"
  | "offline"
  | "error";

export type ProgressResetResult = {
  message: string;
  ok: boolean;
};

export type ProgressResettingScope =
  | "course"
  | `lesson:${FoundationProgressLessonSlug}`
  | null;

type ProgressSyncContextValue = {
  lastSyncedAt: string | null;
  message: string;
  resetCourse: () => Promise<ProgressResetResult>;
  resetLesson: (lessonSlug: string) => Promise<ProgressResetResult>;
  resettingScope: ProgressResettingScope;
  retry: () => void;
  status: ProgressSyncStatus;
};

const unavailableReset = async (): Promise<ProgressResetResult> => ({
  message: "Progress reset is not available yet. Please try again.",
  ok: false,
});

const ProgressSyncContext = createContext<ProgressSyncContextValue>({
  lastSyncedAt: null,
  message: "Progress is saved on this device.",
  resetCourse: unavailableReset,
  resetLesson: unavailableReset,
  resettingScope: null,
  retry: () => {},
  status: "device-only",
});

const ACTIVE_PRINCIPAL_KEY = "vibe-to-code:progress:v2:active-principal";
const GUEST_CLAIM_PREFIX = "vibe-to-code:progress:v2:guest-claim:";
const COURSE_PROGRESS_EVENT = "vibe-to-code:course-progress";
const LESSON_PROGRESS_EVENT = "vibe-to-code:lesson-progress";

type RemoteProgressResponse = {
  courseEpoch?: number;
  progress?: unknown;
  revision?: number;
  status?: string;
};

function safeRead(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function userPrincipal(userId: string) {
  return `user:${userId}`;
}

function restoreGuestProjection() {
  const deviceId = getOrCreateProgressDeviceId();
  const guest =
    readCanonicalProgressCache() ??
    createEmptyCanonicalFoundationProgress(new Date().toISOString());
  writeCanonicalProgressCache(null, guest);
  applyCanonicalFoundationProgressToLegacyStores(guest, { deviceId });
  safeWrite(ACTIVE_PRINCIPAL_KEY, "guest");
}

function collectPrincipalProgress(
  userId: string,
  deviceId: string,
  importedAt: string,
  baseline?: CanonicalFoundationProgress,
) {
  const cached =
    baseline ??
    readCanonicalProgressCache(userId) ??
    createEmptyCanonicalFoundationProgress(importedAt);

  if ((safeRead(ACTIVE_PRINCIPAL_KEY) ?? "guest") !== userPrincipal(userId)) {
    return cached;
  }

  const projection = convertLegacyFoundationProgress({
    ...collectLegacyFoundationProgressFromStorage(),
    baseline: cached,
    deviceId,
    importedAt,
  });
  return mergeCanonicalFoundationProgress(cached, projection);
}

function writeMonotonicUserProgressCheckpoint(
  userId: string,
  candidate: CanonicalFoundationProgress,
  updatedAt: string,
) {
  const reconciled = reconcileCanonicalFoundationProgressCheckpoint(
    candidate,
    readCanonicalProgressCache(userId),
    updatedAt,
  );
  writeCanonicalProgressCache(userId, reconciled.progress);
  return reconciled;
}

function refreshGuestCanonicalCache(deviceId: string, importedAt: string) {
  // Intentionally omit the old canonical baseline: a local reset is a
  // deletion, so merging the pre-reset cache would immediately resurrect it.
  const guest = convertLegacyFoundationProgress({
    ...collectLegacyFoundationProgressFromStorage(),
    deviceId,
    importedAt,
  });
  writeCanonicalProgressCache(null, guest);
  safeWrite(ACTIVE_PRINCIPAL_KEY, "guest");
}

export function ProgressSyncProvider({ children }: { children: ReactNode }) {
  const enabled = isProgressSyncEnabled();
  const { status: authStatus, user: authUser } = useAuthUser();
  const [status, setStatus] = useState<ProgressSyncStatus>("device-only");
  const [message, setMessage] = useState("Progress is saved on this device.");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [resettingScope, setResettingScope] =
    useState<ProgressResettingScope>(null);
  const userRef = useRef<User | null>(null);
  const synchronizeRef = useRef<(user: User) => Promise<void>>(async () => {});
  const syncingRef = useRef(false);
  const resettingRef = useRef(false);
  const resetAttemptRef = useRef<{
    idempotencyKey: string;
    scopeKey: string;
  } | null>(null);
  const queuedRef = useRef(false);
  const suppressEventsRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update the async identity guard before passive effects can start a sync or
  // restore a projection for the newly rendered auth state.
  useLayoutEffect(() => {
    userRef.current = authUser;
  }, [authUser]);

  const synchronize = useCallback(async (user: User) => {
    if (!enabled) {
      setStatus("device-only");
      setMessage("Progress is saved on this device.");
      return;
    }

    const now = new Date().toISOString();
    const deviceId = getOrCreateProgressDeviceId();
    const principal = userPrincipal(user.id);
    const initialPrincipal = safeRead(ACTIVE_PRINCIPAL_KEY) ?? "guest";

    // Never leave another account's local projection visible just because the
    // new session starts offline. Guest progress remains claimable once a
    // server connection is available; authenticated caches are always isolated.
    if (initialPrincipal.startsWith("user:") && initialPrincipal !== principal) {
      const cachedUser =
        readCanonicalProgressCache(user.id) ??
        createEmptyCanonicalFoundationProgress(now);
      suppressEventsRef.current = true;
      applyCanonicalFoundationProgressToLegacyStores(cachedUser, { deviceId });
      safeWrite(ACTIVE_PRINCIPAL_KEY, principal);
      queueMicrotask(() => {
        suppressEventsRef.current = false;
      });
    }

    if (!navigator.onLine) {
      setStatus("offline");
      setMessage("Saved on this device. Sync will retry when you are online.");
      return;
    }

    if (resettingRef.current) {
      queuedRef.current = true;
      return;
    }

    if (syncingRef.current) {
      queuedRef.current = true;
      return;
    }

    syncingRef.current = true;
    setStatus("syncing");
    setMessage("Combining device and account progress...");

    try {
      const activePrincipal = safeRead(ACTIVE_PRINCIPAL_KEY) ?? "guest";
      const cachedUser = readCanonicalProgressCache(user.id);
      let local = cachedUser ?? createEmptyCanonicalFoundationProgress(now);
      let claimedGuestSnapshot: CanonicalFoundationProgress | null = null;
      let guestFingerprint: string | null = null;
      let claimedGuest = false;

      if (activePrincipal === "guest") {
        const collected = collectLegacyFoundationProgressFromStorage();
        const guestBaseline = readCanonicalProgressCache();
        const guestProjection = convertLegacyFoundationProgress({
          ...collected,
          baseline: guestBaseline,
          deviceId,
          importedAt: now,
        });
        const guest = guestBaseline
          ? mergeCanonicalFoundationProgress(guestBaseline, guestProjection)
          : guestProjection;
        writeCanonicalProgressCache(null, guest);

        guestFingerprint = createLegacyImportFingerprint(
          collected.aggregate,
          collected.detailedByStorageKey,
        );
        const claimKey = getLegacyImportFingerprintStorageKey(user.id, deviceId);
        const guestClaimKey = `${GUEST_CLAIM_PREFIX}${deviceId}:${guestFingerprint}`;
        const claimedByUser = safeRead(guestClaimKey);
        const alreadyClaimedByAnotherUser = Boolean(
          claimedByUser && claimedByUser !== user.id,
        );
        const alreadyImportedForUser = safeRead(claimKey) === guestFingerprint;

        if (!alreadyClaimedByAnotherUser && !alreadyImportedForUser) {
          local = mergeCanonicalFoundationProgress(local, guest);
          claimedGuestSnapshot = guest;
          claimedGuest = true;
        }
      } else if (activePrincipal === principal) {
        const collected = collectLegacyFoundationProgressFromStorage();
        const projection = convertLegacyFoundationProgress({
          ...collected,
          baseline: cachedUser,
          deviceId,
          importedAt: now,
        });
        local = cachedUser
          ? mergeCanonicalFoundationProgress(cachedUser, projection)
          : projection;
      } else {
        // Another tab switched accounts after this request began. Never let
        // the old account replace that principal's shared v1 projection.
        return;
      }

      const remoteResponse = await fetch("/api/progress/foundations", {
        cache: "no-store",
      });
      if (!remoteResponse.ok) {
        throw new Error(`Progress fetch failed with ${remoteResponse.status}`);
      }

      const remoteData = (await remoteResponse.json()) as RemoteProgressResponse;
      const remote = normalizeCanonicalFoundationProgress(remoteData.progress) ??
        createEmptyCanonicalFoundationProgress(now);
      remote.revision = remoteData.revision ?? remote.revision;
      remote.courseEpoch = remoteData.courseEpoch ?? remote.courseEpoch;

      let merged = reconcileCanonicalFoundationProgressWithServer(
        remote,
        local,
        now,
      );

      let canonical = remote;
      if (
        !canonicalFoundationProgressDocumentsMatch(merged, remote) ||
        remoteData.progress == null
      ) {
        const commit = async (payload: CanonicalFoundationProgress) => {
          const response = await fetch("/api/progress/foundations", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Idempotency-Key": crypto.randomUUID(),
            },
            body: JSON.stringify({
              baseRevision: payload.revision,
              courseEpoch: payload.courseEpoch,
              source: claimedGuest ? "legacy-v1-import" : "local-v2",
              payload,
            }),
          });
          const body = (await response.json()) as RemoteProgressResponse;
          return { body, response };
        };

        let committed = await commit(merged);
        if (committed.response.status === 409) {
          const latest = normalizeCanonicalFoundationProgress(committed.body.progress);
          if (!latest) throw new Error("Progress conflict response was invalid");
          latest.revision = committed.body.revision ?? latest.revision;
          latest.courseEpoch = committed.body.courseEpoch ?? latest.courseEpoch;
          merged = reconcileCanonicalFoundationProgressWithServer(
            latest,
            local,
            now,
          );
          committed = await commit(merged);
        }

        if (!committed.response.ok) {
          throw new Error(`Progress commit failed with ${committed.response.status}`);
        }

        canonical = normalizeCanonicalFoundationProgress(committed.body.progress) ?? merged;
        canonical.revision = committed.body.revision ?? canonical.revision;
        canonical.courseEpoch = committed.body.courseEpoch ?? canonical.courseEpoch;
      }

      let guestAfterClaim: CanonicalFoundationProgress | null = null;
      let latestClaimedGuest: CanonicalFoundationProgress | null = null;

      if (claimedGuest && claimedGuestSnapshot && guestFingerprint) {
        const currentGuest = (safeRead(ACTIVE_PRINCIPAL_KEY) ?? "guest") === "guest"
          ? convertLegacyFoundationProgress({
              ...collectLegacyFoundationProgressFromStorage(),
              baseline: readCanonicalProgressCache(),
              deviceId,
              importedAt: new Date().toISOString(),
            })
          : readCanonicalProgressCache() ?? claimedGuestSnapshot;
        latestClaimedGuest = currentGuest;
        guestAfterClaim = subtractClaimedGuestProgress(
          currentGuest,
          claimedGuestSnapshot,
        );
        writeCanonicalProgressCache(null, guestAfterClaim);
        safeWrite(
          getLegacyImportFingerprintStorageKey(user.id, deviceId),
          guestFingerprint,
        );
        safeWrite(
          `${GUEST_CLAIM_PREFIX}${deviceId}:${guestFingerprint}`,
          user.id,
        );
      }

      if (userRef.current?.id !== user.id) {
        // The account request can finish after sign-out. Its private cache is
        // still useful, but it must never replace another principal's shared
        // v1 projection. If this request claimed the now-active guest, reflect
        // that completed transfer without touching a different signed-in user.
        writeMonotonicUserProgressCheckpoint(
          user.id,
          canonical,
          new Date().toISOString(),
        );
        if (
          !userRef.current &&
          guestAfterClaim &&
          (safeRead(ACTIVE_PRINCIPAL_KEY) ?? "guest") === "guest"
        ) {
          suppressEventsRef.current = true;
          applyCanonicalFoundationProgressToLegacyStores(guestAfterClaim, {
            deviceId,
          });
          queueMicrotask(() => {
            suppressEventsRef.current = false;
          });
        }
        return;
      }

      // A learner can complete a step or save code while GET/PUT is in
      // flight. Re-collect the live projection before writing anything back,
      // otherwise this older response would erase the new edit before the
      // queued sync could read it.
      const projectionPrincipal = safeRead(ACTIVE_PRINCIPAL_KEY) ?? "guest";
      if (
        !canProjectFoundationProgressForPrincipal(
          projectionPrincipal,
          principal,
          claimedGuest && latestClaimedGuest !== null,
        )
      ) {
        writeMonotonicUserProgressCheckpoint(
          user.id,
          canonical,
          new Date().toISOString(),
        );
        return;
      }

      // A higher revision can only have come from a later server response in
      // another tab. Leave its cache and projection untouched and fetch again
      // instead of trying to reconcile from an obsolete concurrency point.
      const cachedBeforeProjection = readCanonicalProgressCache(user.id);
      if (
        cachedBeforeProjection &&
        cachedBeforeProjection.revision > canonical.revision
      ) {
        queuedRef.current = true;
        return;
      }

      let latestLocal = canonical;
      if (projectionPrincipal === principal) {
        latestLocal = collectPrincipalProgress(
          user.id,
          deviceId,
          new Date().toISOString(),
        );
      } else if (projectionPrincipal === "guest" && latestClaimedGuest) {
        latestLocal = latestClaimedGuest;
      }

      const projected = reconcileCanonicalFoundationProgressWithServer(
        canonical,
        latestLocal,
        new Date().toISOString(),
      );
      const finalCheckpoint = writeMonotonicUserProgressCheckpoint(
        user.id,
        projected,
        new Date().toISOString(),
      );
      if (finalCheckpoint.cachedRevisionWasNewer) {
        queuedRef.current = true;
        return;
      }
      const finalProgress = finalCheckpoint.progress;
      const hasPendingLocalChanges =
        !canonicalFoundationProgressDocumentsMatch(finalProgress, canonical);

      // Narrow the remaining cross-tab window before mutating shared stores.
      if ((safeRead(ACTIVE_PRINCIPAL_KEY) ?? "guest") !== projectionPrincipal) {
        return;
      }

      if (claimedGuest && latestClaimedGuest) {
        // The active account now owns every guest edit made before this claim
        // completed. Keep the guest namespace empty so another account cannot
        // claim the same in-flight edit later.
        writeCanonicalProgressCache(
          null,
          subtractClaimedGuestProgress(latestClaimedGuest, latestClaimedGuest),
        );
      }

      safeWrite(ACTIVE_PRINCIPAL_KEY, principal);
      suppressEventsRef.current = true;
      applyCanonicalFoundationProgressToLegacyStores(finalProgress, { deviceId });
      queueMicrotask(() => {
        suppressEventsRef.current = false;
      });
      if (hasPendingLocalChanges) queuedRef.current = true;
      setLastSyncedAt(new Date().toISOString());
      setStatus("synced");
      setMessage("Progress synced. Nothing was removed.");
    } catch {
      if (userRef.current?.id === user.id) {
        setStatus(navigator.onLine ? "error" : "offline");
        setMessage(
          navigator.onLine
            ? "Your progress is still safe on this device. Try syncing again."
            : "Saved on this device. Sync will retry when you are online.",
        );
      }
    } finally {
      syncingRef.current = false;
      const queuedUser = userRef.current;
      if (
        queuedRef.current &&
        queuedUser &&
        (safeRead(ACTIVE_PRINCIPAL_KEY) ?? "guest") ===
          userPrincipal(queuedUser.id)
      ) {
        queuedRef.current = false;
        void synchronizeRef.current(queuedUser);
      }
    }
  }, [enabled]);


  useEffect(() => {
    synchronizeRef.current = synchronize;
  }, [synchronize]);

  const retry = useCallback(() => {
    if (userRef.current) void synchronize(userRef.current);
  }, [synchronize]);

  const resetProgress = useCallback(async (
    reset: FoundationProgressResetScope,
  ): Promise<ProgressResetResult> => {
    const localReset = () => {
      if (reset.scope === "course") {
        resetLocalCourseProgress("foundations");
      } else {
        resetLocalLessonProgress("foundations", reset.lessonSlug);
      }
    };
    const successMessage = reset.scope === "course"
      ? "Published Foundation progress was reset."
      : "Lesson progress was reset.";

    if (!enabled || authStatus === "guest" || authStatus === "unavailable") {
      localReset();
      refreshGuestCanonicalCache(
        getOrCreateProgressDeviceId(),
        new Date().toISOString(),
      );

      setStatus("device-only");
      setMessage("Progress is saved privately on this device.");
      return { message: successMessage, ok: true };
    }

    if (authStatus !== "ready" || !authUser) {
      const resetMessage =
        "Your account is still being checked. No progress was changed; try reset again.";
      setStatus("error");
      setMessage(resetMessage);
      return { message: resetMessage, ok: false };
    }

    if (!navigator.onLine) {
      const resetMessage =
        "You are offline. No progress was changed; reconnect and try reset again.";
      setStatus("offline");
      setMessage(resetMessage);
      return { message: resetMessage, ok: false };
    }

    if (syncingRef.current || resettingRef.current) {
      const resetMessage =
        "Progress is already updating. No progress was changed; wait a moment and try reset again.";
      setMessage(resetMessage);
      return { message: resetMessage, ok: false };
    }

    const principal = userPrincipal(authUser.id);
    if ((safeRead(ACTIVE_PRINCIPAL_KEY) ?? "guest") !== principal) {
      const resetMessage =
        "Finish syncing this account before resetting progress, then try again.";
      setStatus("error");
      setMessage(resetMessage);
      return { message: resetMessage, ok: false };
    }

    const scope = reset.scope === "course"
      ? "course"
      : `lesson:${reset.lessonSlug}` as const;
    const scopeKey = `${authUser.id}:${scope}`;
    const attempt = resetAttemptRef.current?.scopeKey === scopeKey
      ? resetAttemptRef.current
      : { idempotencyKey: crypto.randomUUID(), scopeKey };
    resetAttemptRef.current = attempt;
    resettingRef.current = true;
    setResettingScope(scope);
    setStatus("syncing");
    setMessage("Resetting progress in your account...");

    let synchronizeAfterReset = false;

    try {
      const now = new Date().toISOString();
      const deviceId = getOrCreateProgressDeviceId();
      const previous = collectPrincipalProgress(authUser.id, deviceId, now);
      const response = await fetch("/api/progress/foundations/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": attempt.idempotencyKey,
        },
        body: JSON.stringify(reset),
      });

      // A successful response means the server consumed this attempt. In
      // particular, a duplicate may contain a newer current document instead
      // of the original response snapshot. If that document cannot prove the
      // reset below, the next explicit click must use a fresh idempotency key.
      if (response.ok || (response.status < 500 && response.status !== 429)) {
        resetAttemptRef.current = null;
      }

      let body: RemoteProgressResponse;
      try {
        body = (await response.json()) as RemoteProgressResponse;
      } catch {
        throw new Error("Progress reset response was invalid");
      }

      if (!response.ok) {
        throw new Error(`Progress reset failed with ${response.status}`);
      }

      if (body.status !== "applied" && body.status !== "duplicate") {
        throw new Error("Progress reset acknowledgment was invalid");
      }

      const server = normalizeCanonicalFoundationProgress(body.progress);
      if (!server) {
        throw new Error("Progress reset payload was invalid");
      }
      server.revision = body.revision ?? server.revision;
      server.courseEpoch = body.courseEpoch ?? server.courseEpoch;

      // First prove the server advanced the requested epoch relative to the
      // exact pre-request checkpoint. A later tab checkpoint must not make an
      // otherwise valid acknowledgement appear stale.
      const resetCheckpoint = applyAcknowledgedFoundationProgressReset(
        previous,
        server,
        reset,
      );
      if (!resetCheckpoint) {
        throw new Error("Progress reset was not acknowledged safely");
      }

      const activeAfterReset = safeRead(ACTIVE_PRINCIPAL_KEY) ?? "guest";
      const canProjectReset =
        userRef.current?.id === authUser.id && activeAfterReset === principal;
      const cachedAfterReset = readCanonicalProgressCache(authUser.id);

      // A same-or-higher revision means another tab already handled this
      // acknowledgement or advanced beyond it. Never downgrade that cache or
      // project this older snapshot; a fresh sync will converge the view.
      if (
        cachedAfterReset &&
        cachedAfterReset.revision >= server.revision
      ) {
        if (canProjectReset) {
          synchronizeAfterReset = true;
          setStatus("synced");
          setMessage(successMessage);
        }
        return canProjectReset
          ? { message: successMessage, ok: true }
          : {
              message: "Progress was reset in that account. Your current view was not changed.",
              ok: true,
            };
      }

      if (!canProjectReset) {
        writeMonotonicUserProgressCheckpoint(
          authUser.id,
          resetCheckpoint,
          new Date().toISOString(),
        );
        return {
          message: "Progress was reset in that account. Your current view was not changed.",
          ok: true,
        };
      }

      // Include edits made while the request was in flight. The pre-reset
      // baseline keeps those edits on the old epoch, so the acknowledged reset
      // remains authoritative for its course or lesson scope.
      const latestPrevious = collectPrincipalProgress(
        authUser.id,
        deviceId,
        now,
        previous,
      );
      const acknowledged = reconcileCanonicalFoundationProgressWithServer(
        server,
        latestPrevious,
        new Date().toISOString(),
      );

      const cacheBeforeResetWrite = readCanonicalProgressCache(authUser.id);
      if (
        cacheBeforeResetWrite &&
        cacheBeforeResetWrite.revision >= server.revision
      ) {
        synchronizeAfterReset = true;
        setStatus("synced");
        setMessage(successMessage);
        return { message: successMessage, ok: true };
      }

      const finalCheckpoint = writeMonotonicUserProgressCheckpoint(
        authUser.id,
        acknowledged,
        new Date().toISOString(),
      );
      if (finalCheckpoint.cachedRevisionWasNewer) {
        synchronizeAfterReset = true;
        setStatus("synced");
        setMessage(successMessage);
        return { message: successMessage, ok: true };
      }
      const finalProgress = finalCheckpoint.progress;

      if (
        userRef.current?.id !== authUser.id ||
        (safeRead(ACTIVE_PRINCIPAL_KEY) ?? "guest") !== principal
      ) {
        return {
          message: "Progress was reset in that account. Your current view was not changed.",
          ok: true,
        };
      }

      safeWrite(ACTIVE_PRINCIPAL_KEY, principal);
      suppressEventsRef.current = true;
      applyCanonicalFoundationProgressToLegacyStores(finalProgress, { deviceId });
      queueMicrotask(() => {
        suppressEventsRef.current = false;
      });
      setLastSyncedAt(new Date().toISOString());
      setStatus("synced");
      setMessage(successMessage);
      synchronizeAfterReset =
        !canonicalFoundationProgressDocumentsMatch(finalProgress, server);
      return { message: successMessage, ok: true };
    } catch {
      const online = navigator.onLine;
      const resetMessage = online
        ? "Reset could not be confirmed. No device progress was changed; try reset again."
        : "Connection was lost. No device progress was changed; reconnect and try reset again.";
      if (userRef.current?.id === authUser.id) {
        setStatus(online ? "error" : "offline");
        setMessage(resetMessage);
      }
      return { message: resetMessage, ok: false };
    } finally {
      resettingRef.current = false;
      setResettingScope(null);

      const queuedUser = userRef.current;
      if (
        (synchronizeAfterReset || queuedRef.current) &&
        queuedUser &&
        (safeRead(ACTIVE_PRINCIPAL_KEY) ?? "guest") ===
          userPrincipal(queuedUser.id)
      ) {
        queuedRef.current = false;
        void synchronizeRef.current(queuedUser);
      }
    }
  }, [authStatus, authUser, enabled]);

  const resetCourse = useCallback(
    () => resetProgress({ scope: "course" }),
    [resetProgress],
  );

  const resetLesson = useCallback((lessonSlug: string) => {
    const lesson = getFoundationProgressLessonManifest(lessonSlug);
    if (!lesson) {
      return Promise.resolve({
        message: "This lesson cannot be reset from Foundation progress.",
        ok: false,
      });
    }
    return resetProgress({ scope: "lesson", lessonSlug: lesson.slug });
  }, [resetProgress]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      if (authStatus === "ready" && authUser) {
        void synchronize(authUser);
        return;
      }

      if (
        authStatus === "guest" &&
        (safeRead(ACTIVE_PRINCIPAL_KEY) ?? "guest").startsWith("user:")
      ) {
        restoreGuestProjection();
        setStatus("device-only");
        setMessage("Progress is saved privately on this device.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [authStatus, authUser, synchronize]);

  useEffect(() => {
    function scheduleSync() {
      if (suppressEventsRef.current || !userRef.current) return;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(() => {
        if (userRef.current) void synchronize(userRef.current);
      }, 1_200);
    }

    function handleOnline() {
      if (userRef.current) void synchronize(userRef.current);
    }

    window.addEventListener(COURSE_PROGRESS_EVENT, scheduleSync);
    window.addEventListener(LESSON_PROGRESS_EVENT, scheduleSync);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener(COURSE_PROGRESS_EVENT, scheduleSync);
      window.removeEventListener(LESSON_PROGRESS_EVENT, scheduleSync);
      window.removeEventListener("online", handleOnline);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [synchronize]);

  const value = useMemo(
    () => ({
      lastSyncedAt,
      message,
      resetCourse,
      resetLesson,
      resettingScope,
      retry,
      status,
    }),
    [
      lastSyncedAt,
      message,
      resetCourse,
      resetLesson,
      resettingScope,
      retry,
      status,
    ],
  );

  return (
    <ProgressSyncContext.Provider value={value}>
      {children}
    </ProgressSyncContext.Provider>
  );
}

export function useProgressSync() {
  return useContext(ProgressSyncContext);
}
