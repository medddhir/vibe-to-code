/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { beforeEach, describe, it } = require("node:test");

const {
  FOUNDATION_PROGRESS_MANIFEST,
  FOUNDATION_PROGRESS_MANIFEST_VERSION_2,
  FOUNDATION_PROGRESS_MANIFEST_VERSION_3,
  getFoundationProgressLessonManifest,
} = require("../src/lib/progress-manifest.ts");
const { lessonContentRegistry } = require("../src/data/lesson-content-registry.ts");
const {
  clearStoredLessonProgress,
  getLessonStorageKey,
  writeLessonProgressSnapshot,
} = require("../src/lib/lesson-progress-storage.ts");
const {
  MAX_SAVED_CODE_UNITS,
  applyAcknowledgedFoundationProgressReset,
  canProjectFoundationProgressForPrincipal,
  canonicalFoundationProgressDocumentsMatch,
  convertLegacyFoundationProgress,
  createEmptyCanonicalFoundationProgress,
  createLegacyImportFingerprint,
  deriveCanonicalFoundationProgressSummary,
  getCanonicalProgressStorageKey,
  getLegacyImportFingerprintStorageKey,
  mergeCanonicalFoundationProgress,
  normalizeCanonicalFoundationProgress,
  parseCanonicalFoundationProgress,
  reconcileCanonicalFoundationProgressCheckpoint,
  reconcileCanonicalFoundationProgressWithServer,
  subtractClaimedGuestProgress,
} = require("../src/lib/progress-sync.ts");
const {
  applyCanonicalFoundationProgressToLegacyStores,
  clearCanonicalProgressCache,
  collectLegacyFoundationProgressFromStorage,
  getOrCreateProgressDeviceId,
  progressDeviceIdStorageKey,
  readCanonicalProgressCache,
  writeCanonicalProgressCache,
} = require("../src/lib/progress-sync-storage.ts");
const {
  foundationPublishedOrder,
  resetCourseProgress,
  resetLessonProgress,
} = require("../src/lib/course-progress.ts");

const importedAt = "2026-08-12T12:00:00.000Z";
const laterAt = "2026-08-12T13:00:00.000Z";
const latestAt = "2026-08-12T14:00:00.000Z";
const deviceId = "device-a";

function version(record, lessonSlug) {
  const manifest = getFoundationProgressLessonManifest(lessonSlug);
  return record.lessons[lessonSlug].versions[String(manifest.lessonVersion)];
}

function legacyAggregate(lessonSlug, lesson = {}) {
  return {
    version: 1,
    courseVersion: 2,
    legacyLevel1Access: false,
    lastVisitedLesson: lessonSlug,
    lessonOrder: FOUNDATION_PROGRESS_MANIFEST_VERSION_2.map((item) => item.slug),
    lessons: { [lessonSlug]: lesson },
    updatedAt: importedAt,
  };
}

beforeEach(() => {
  localStorage.clear();
  clearCanonicalProgressCache();
  clearCanonicalProgressCache("user-a");
  clearCanonicalProgressCache("user-b");
  for (const lesson of FOUNDATION_PROGRESS_MANIFEST) {
    clearStoredLessonProgress(lesson.slug);
  }
});

describe("Foundation progress manifest and legacy import", () => {
  it("declares all 23 published lessons and the exact current detailed versions", () => {
    assert.equal(FOUNDATION_PROGRESS_MANIFEST.length, 23);
    assert.deepEqual(
      FOUNDATION_PROGRESS_MANIFEST.map((lesson) => lesson.slug),
      foundationPublishedOrder,
    );
    assert.equal(getFoundationProgressLessonManifest("what-is-code").lessonVersion, 3);
    assert.equal(
      FOUNDATION_PROGRESS_MANIFEST
        .filter((lesson) => lesson.slug !== "what-is-code")
        .every((lesson) => lesson.lessonVersion === 1),
      true,
    );
  });

  it("keeps the manifest aligned with mechanically extractable lesson and activity IDs", () => {
    for (const lesson of FOUNDATION_PROGRESS_MANIFEST) {
      const definition = lessonContentRegistry.bySlug(lesson.slug);
      if (definition) {
        assert.deepEqual(
          lesson.stepIds,
          definition.guidedSteps.map((step) => step.id),
        );
        assert.deepEqual(
          lesson.activityIds,
          definition.activities.map((activity) => activity.id),
        );
        continue;
      }
      const source = fs.readFileSync(
        path.join(process.cwd(), "src/app/lessons", lesson.slug, "page.tsx"),
        "utf8",
      );
      const stepsBlock = source.match(
        /const lessonSteps: GuidedLessonStep\[\] = \[([\s\S]*?)\n\];/,
      );
      assert.ok(stepsBlock, `Missing lessonSteps for ${lesson.slug}`);

      const extractedSteps = [...stepsBlock[1].matchAll(/\bid:\s*"([^"]+)"/g)]
        .map((match) => match[1]);
      const renderedActivityIds = [...source.matchAll(/\bstepId="([^"]+)"/g)]
        .map((match) => match[1]);
      const requiredActivityIds = [
        ...stepsBlock[1].matchAll(/requiredActivityIds:\s*\[([^\]]+)\]/g),
      ].flatMap((match) =>
        [...match[1].matchAll(/"([^"]+)"/g)].map((idMatch) => idMatch[1]),
      );
      const extractedActivities = [
        ...new Set(
          [...renderedActivityIds, ...requiredActivityIds].filter(
            (id) => !extractedSteps.includes(id),
          ),
        ),
      ];

      assert.deepEqual(extractedSteps, [...lesson.stepIds], `${lesson.slug} step IDs drifted`);
      assert.deepEqual(
        extractedActivities,
        [...lesson.activityIds],
        `${lesson.slug} activity IDs drifted`,
      );
    }
  });

  it("upgrades canonical version 2 losslessly and adds empty later lessons", () => {
    const version2 = createEmptyCanonicalFoundationProgress(importedAt);
    version2.curriculumVersion = 2;
    Object.keys(version2.lessons).slice(14).forEach((slug) => delete version2.lessons[slug]);
    version2.courseEpoch = 4;
    version2.revision = 9;
    version2.legacyLevel1Access = true;
    version2.lastVisited = {
      value: "frontend-backend-api-database-cloud",
      updatedAt: laterAt,
    };
    version2.updatedAt = latestAt;
    const lesson14 = version2.lessons["frontend-backend-api-database-cloud"];
    lesson14.lessonEpoch = 3;
    lesson14.completedAt = laterAt;
    const lesson14Version = lesson14.versions["1"];
    lesson14Version.currentStep = { value: "journey-mission", updatedAt: laterAt };
    lesson14Version.completedStepsAt = { "journey-concept": importedAt };
    lesson14Version.completedActivitiesAt = { "backend-validation-check": laterAt };
    lesson14Version.attempts = { "journey-mission": { "device-a": 7 } };
    lesson14Version.hints = { "journey-mission": { "device-a": 2 } };
    lesson14Version.savedCode = {
      "journey-mission": { value: "preserve exactly", updatedAt: latestAt },
    };

    const migrated = parseCanonicalFoundationProgress(version2);
    assert.equal(migrated.curriculumVersion, 4);
    assert.equal(migrated.courseEpoch, 4);
    assert.equal(migrated.revision, 9);
    assert.equal(migrated.legacyLevel1Access, true);
    assert.deepEqual(migrated.lastVisited, version2.lastVisited);
    assert.equal(migrated.updatedAt, latestAt);
    assert.deepEqual(
      migrated.lessons["frontend-backend-api-database-cloud"],
      lesson14,
    );
    assert.deepEqual(migrated.lessons["internet-web-browser-server"], {
      lessonEpoch: 0,
      completedAt: null,
      versions: {
        1: {
          lessonVersion: 1,
          currentStep: null,
          completedStepsAt: {},
          completedActivitiesAt: {},
          attempts: {},
          hints: {},
          savedCode: {},
        },
      },
    });
  });

  it("upgrades canonical version 3 losslessly and adds only empty Lessons 16–23", () => {
    const version3 = createEmptyCanonicalFoundationProgress(importedAt);
    version3.curriculumVersion = 3;
    Object.keys(version3.lessons).slice(15).forEach((slug) => delete version3.lessons[slug]);
    version3.courseEpoch = 6;
    version3.revision = 12;
    version3.legacyLevel1Access = true;
    version3.lastVisited = { value: "internet-web-browser-server", updatedAt: laterAt };
    version3.updatedAt = latestAt;
    const lesson15 = version3.lessons["internet-web-browser-server"];
    lesson15.lessonEpoch = 2;
    lesson15.completedAt = laterAt;
    lesson15.versions["1"].currentStep = { value: "explain-complete-model", updatedAt: laterAt };
    lesson15.versions["1"].completedStepsAt = { "trace-page-journey": importedAt };
    lesson15.versions["1"].completedActivitiesAt = { "order-page-journey": laterAt };
    lesson15.versions["1"].attempts = { "order-page-journey": { "device-a": 5 } };
    lesson15.versions["1"].hints = { "order-page-journey": { "device-a": 1 } };
    lesson15.versions["1"].savedCode = {
      "order-page-journey": { value: "preserve v3", updatedAt: latestAt },
    };

    const migrated = parseCanonicalFoundationProgress(version3);
    assert.equal(migrated.curriculumVersion, 4);
    assert.equal(migrated.courseEpoch, 6);
    assert.equal(migrated.revision, 12);
    assert.equal(migrated.legacyLevel1Access, true);
    assert.deepEqual(migrated.lastVisited, version3.lastVisited);
    assert.equal(migrated.updatedAt, latestAt);
    assert.deepEqual(migrated.lessons["internet-web-browser-server"], lesson15);
    for (const lesson of FOUNDATION_PROGRESS_MANIFEST.slice(15)) {
      assert.deepEqual(migrated.lessons[lesson.slug], {
        lessonEpoch: 0,
        completedAt: null,
        versions: {
          1: {
            lessonVersion: 1,
            currentStep: null,
            completedStepsAt: {},
            completedActivitiesAt: {},
            attempts: {},
            hints: {},
            savedCode: {},
          },
        },
      });
    }
    assert.deepEqual(FOUNDATION_PROGRESS_MANIFEST_VERSION_3, FOUNDATION_PROGRESS_MANIFEST.slice(0, 15));
  });

  it("imports both stores, uses the v3 first-lesson key, and never doubles mirrored attempts", () => {
    const exactKey = getLessonStorageKey("what-is-code", 3);
    const obsoleteKey = getLessonStorageKey("what-is-code", 1);
    const aggregate = legacyAggregate("what-is-code", {
      completedAt: "2026-08-12T11:40:00.000Z",
      currentCheckpoint: "flow",
      completedCheckpointIds: ["flow", "unknown-activity"],
      stepAttempts: { launch: 2, "unknown-id": 99 },
      stepHints: { launch: 1 },
    });
    const detailedByStorageKey = {
      [obsoleteKey]: JSON.stringify({
        version: 1,
        lessonVersion: 1,
        currentStepId: "debug",
        completedStepIds: ["debug"],
        practiceCompletedIds: ["debug"],
        attemptsByStep: { debug: 10 },
        savedCodeByStep: { debug: "obsolete" },
        completedAt: null,
      }),
      [exactKey]: JSON.stringify({
        version: 1,
        lessonVersion: 3,
        currentStepId: "predict",
        completedStepIds: ["launch", "unknown-step"],
        practiceCompletedIds: ["launch", "flow", "unknown-activity"],
        attemptsByStep: { launch: 3, "unknown-id": 50 },
        savedCodeByStep: { remix: 'name = "Medhir"', "unknown-id": "ignore" },
        completedAt: "2026-08-12T11:50:00.000Z",
      }),
    };

    const imported = convertLegacyFoundationProgress({
      aggregate,
      detailedByStorageKey,
      deviceId,
      importedAt,
    });
    const firstLesson = version(imported, "what-is-code");

    assert.equal(imported.lessons["what-is-code"].completedAt, "2026-08-12T11:40:00.000Z");
    assert.deepEqual(firstLesson.currentStep, { value: "predict", updatedAt: importedAt });
    assert.deepEqual(firstLesson.completedStepsAt, { launch: importedAt });
    assert.deepEqual(firstLesson.completedActivitiesAt, {
      launch: importedAt,
      flow: importedAt,
    });
    assert.deepEqual(firstLesson.attempts.launch, { [deviceId]: 3 });
    assert.deepEqual(firstLesson.hints.launch, { [deviceId]: 1 });
    assert.equal(firstLesson.savedCode.remix.value, 'name = "Medhir"');
    assert.equal(firstLesson.savedCode.debug, undefined);
    assert.equal(firstLesson.attempts["unknown-id"], undefined);
  });

  it("treats corrupted records, wrong versions, unknown IDs, and oversized code as absent", () => {
    const detailKey = getLessonStorageKey("what-is-code", 3);
    const oversizedCode = "x".repeat(MAX_SAVED_CODE_UNITS + 1);
    const imported = convertLegacyFoundationProgress({
      aggregate: "{not json",
      detailedByStorageKey: {
        [detailKey]: {
          version: 1,
          lessonVersion: 3,
          currentStepId: "invented-step",
          completedStepIds: ["invented-step"],
          practiceCompletedIds: ["invented-activity"],
          attemptsByStep: { "invented-step": 5, launch: Number.POSITIVE_INFINITY },
          savedCodeByStep: { launch: oversizedCode, "invented-step": "bad" },
          completedAt: "not-a-time",
        },
      },
      deviceId,
      importedAt,
    });
    const firstLesson = version(imported, "what-is-code");

    assert.equal(imported.lastVisited, null);
    assert.equal(imported.lessons["what-is-code"].completedAt, null);
    assert.equal(firstLesson.currentStep, null);
    assert.deepEqual(firstLesson.completedStepsAt, {});
    assert.deepEqual(firstLesson.completedActivitiesAt, {});
    assert.deepEqual(firstLesson.attempts, {});
    assert.deepEqual(firstLesson.savedCode, {});
    assert.ok(normalizeCanonicalFoundationProgress(imported));
  });

  it("preserves legacy Level 1 access when the old record contains Level 1 activity", () => {
    const aggregate = legacyAggregate("values-variables-types", {
      currentCheckpoint: "value-lab",
      completedCheckpointIds: ["value-lab"],
      stepAttempts: {},
      stepHints: {},
    });
    aggregate.courseVersion = 1;
    delete aggregate.legacyLevel1Access;

    const imported = convertLegacyFoundationProgress({
      aggregate,
      detailedByStorageKey: {},
      deviceId,
      importedAt,
    });

    assert.equal(imported.legacyLevel1Access, true);
  });

  it("strictly rejects unknown canonical IDs and saved code over the client limit", () => {
    const unknown = createEmptyCanonicalFoundationProgress(importedAt);
    version(unknown, "what-is-code").completedStepsAt["invented-step"] = importedAt;
    assert.equal(normalizeCanonicalFoundationProgress(unknown), null);

    const oversized = createEmptyCanonicalFoundationProgress(importedAt);
    version(oversized, "what-is-code").savedCode.launch = {
      value: "x".repeat(MAX_SAVED_CODE_UNITS + 1),
      updatedAt: importedAt,
    };
    assert.equal(normalizeCanonicalFoundationProgress(oversized), null);
  });

  it("rejects client timestamps that are implausibly far in the future", () => {
    const progress = createEmptyCanonicalFoundationProgress(importedAt);
    progress.updatedAt = "9999-01-01T00:00:00.000Z";

    assert.equal(normalizeCanonicalFoundationProgress(progress), null);
  });
});

describe("Canonical progress merge", () => {
  function makeMergeRecords() {
    const first = createEmptyCanonicalFoundationProgress(importedAt);
    const second = createEmptyCanonicalFoundationProgress(laterAt);
    const third = createEmptyCanonicalFoundationProgress(latestAt);
    const firstVersion = version(first, "what-is-code");
    const secondVersion = version(second, "what-is-code");
    const thirdVersion = version(third, "what-is-code");

    firstVersion.completedStepsAt.launch = importedAt;
    firstVersion.attempts.launch = { "device-a": 2 };
    firstVersion.savedCode.remix = { value: "old", updatedAt: importedAt };

    second.lessons["what-is-code"].completedAt = laterAt;
    secondVersion.completedActivitiesAt.flow = laterAt;
    secondVersion.attempts.launch = { "device-a": 3, "device-b": 4 };
    secondVersion.savedCode.remix = { value: "new", updatedAt: laterAt };

    thirdVersion.completedStepsAt.flow = latestAt;
    thirdVersion.hints.launch = { "device-c": 1 };
    thirdVersion.savedCode.remix = { value: null, updatedAt: latestAt };

    return [first, second, third];
  }

  it("is idempotent, commutative, and associative for mergeable progress", () => {
    const [first, second, third] = makeMergeRecords();

    assert.deepEqual(mergeCanonicalFoundationProgress(first, first), first);
    assert.deepEqual(
      mergeCanonicalFoundationProgress(first, second),
      mergeCanonicalFoundationProgress(second, first),
    );
    assert.deepEqual(
      mergeCanonicalFoundationProgress(
        mergeCanonicalFoundationProgress(first, second),
        third,
      ),
      mergeCanonicalFoundationProgress(
        first,
        mergeCanonicalFoundationProgress(second, third),
      ),
    );
  });

  it("unions completion, maxes each device counter, and honors newer code tombstones", () => {
    const [first, second, third] = makeMergeRecords();
    const merged = mergeCanonicalFoundationProgress(
      mergeCanonicalFoundationProgress(first, second),
      third,
    );
    const mergedVersion = version(merged, "what-is-code");
    const summary = deriveCanonicalFoundationProgressSummary(merged);

    assert.deepEqual(mergedVersion.completedStepsAt, {
      launch: importedAt,
      flow: latestAt,
    });
    assert.deepEqual(mergedVersion.attempts.launch, {
      "device-a": 3,
      "device-b": 4,
    });
    assert.equal(mergedVersion.savedCode.remix.value, null);
    assert.equal(summary.completedLessonCount, 1);
    assert.equal(summary.lessonStats["what-is-code"].totalAttempts, 7);
    assert.equal(Object.hasOwn(summary, "unlockedLessons"), false);
  });

  it("keeps the higher reset epoch instead of resurrecting stale progress", () => {
    const stale = createEmptyCanonicalFoundationProgress(importedAt);
    stale.lessons["what-is-code"].completedAt = importedAt;
    const reset = createEmptyCanonicalFoundationProgress(laterAt);
    reset.courseEpoch = 1;

    const merged = mergeCanonicalFoundationProgress(stale, reset);
    assert.equal(merged.courseEpoch, 1);
    assert.equal(merged.lessons["what-is-code"].completedAt, null);
  });

  it("preserves local edits created while a server sync is in flight", () => {
    const server = createEmptyCanonicalFoundationProgress(importedAt);
    server.revision = 7;
    const latestLocal = structuredClone(server);
    const latestVersion = version(latestLocal, "what-is-code");
    latestVersion.completedStepsAt.launch = laterAt;
    latestVersion.savedCode.remix = {
      value: 'name = "Saved during sync"',
      updatedAt: laterAt,
    };

    const reconciled = reconcileCanonicalFoundationProgressWithServer(
      server,
      latestLocal,
      latestAt,
    );

    assert.equal(reconciled.revision, 7);
    assert.equal(reconciled.updatedAt, latestAt);
    assert.equal(version(reconciled, "what-is-code").completedStepsAt.launch, laterAt);
    assert.equal(
      version(reconciled, "what-is-code").savedCode.remix.value,
      'name = "Saved during sync"',
    );
    assert.equal(canonicalFoundationProgressDocumentsMatch(reconciled, server), false);
  });

  it("keeps server reset epochs authoritative while reconciling an in-flight edit", () => {
    const staleLocal = createEmptyCanonicalFoundationProgress(importedAt);
    staleLocal.lessons["what-is-code"].completedAt = importedAt;
    const serverReset = createEmptyCanonicalFoundationProgress(laterAt);
    serverReset.revision = 8;
    serverReset.lessons["what-is-code"].lessonEpoch = 1;

    const reconciled = reconcileCanonicalFoundationProgressWithServer(
      serverReset,
      staleLocal,
      latestAt,
    );

    assert.equal(reconciled.revision, 8);
    assert.equal(reconciled.lessons["what-is-code"].lessonEpoch, 1);
    assert.equal(reconciled.lessons["what-is-code"].completedAt, null);
    assert.equal(canonicalFoundationProgressDocumentsMatch(reconciled, serverReset), true);
  });

  it("never downgrades a newer cross-tab reset checkpoint for a late response", () => {
    const lateResponse = createEmptyCanonicalFoundationProgress(importedAt);
    lateResponse.revision = 7;
    lateResponse.lessons["what-is-code"].completedAt = importedAt;

    const newerCachedReset = createEmptyCanonicalFoundationProgress(laterAt);
    newerCachedReset.revision = 8;
    newerCachedReset.lessons["what-is-code"].lessonEpoch = 1;

    const reconciled = reconcileCanonicalFoundationProgressCheckpoint(
      lateResponse,
      newerCachedReset,
      latestAt,
    );

    assert.equal(reconciled.cachedRevisionWasNewer, true);
    assert.equal(reconciled.progress.revision, 8);
    assert.equal(reconciled.progress.lessons["what-is-code"].lessonEpoch, 1);
    assert.equal(reconciled.progress.lessons["what-is-code"].completedAt, null);
  });

  it("lets a newer server reset replace stale cached progress", () => {
    const staleCached = createEmptyCanonicalFoundationProgress(importedAt);
    staleCached.revision = 7;
    staleCached.lessons["what-is-code"].completedAt = importedAt;

    const resetResponse = createEmptyCanonicalFoundationProgress(laterAt);
    resetResponse.revision = 8;
    resetResponse.courseEpoch = 1;

    const reconciled = reconcileCanonicalFoundationProgressCheckpoint(
      resetResponse,
      staleCached,
      latestAt,
    );

    assert.equal(reconciled.cachedRevisionWasNewer, false);
    assert.equal(reconciled.progress.revision, 8);
    assert.equal(reconciled.progress.courseEpoch, 1);
    assert.equal(reconciled.progress.lessons["what-is-code"].completedAt, null);
  });

  it("merges unsynced edits from an equal-revision cross-tab checkpoint", () => {
    const response = createEmptyCanonicalFoundationProgress(importedAt);
    response.revision = 8;
    const cachedEdit = structuredClone(response);
    version(cachedEdit, "what-is-code").completedStepsAt.launch = laterAt;

    const reconciled = reconcileCanonicalFoundationProgressCheckpoint(
      response,
      cachedEdit,
      latestAt,
    );

    assert.equal(reconciled.cachedRevisionWasNewer, false);
    assert.equal(reconciled.progress.revision, 8);
    assert.equal(
      version(reconciled.progress, "what-is-code").completedStepsAt.launch,
      laterAt,
    );
  });

  it("projects shared stores only for the active principal or its guest claim", () => {
    assert.equal(
      canProjectFoundationProgressForPrincipal("user:a", "user:a", false),
      true,
    );
    assert.equal(
      canProjectFoundationProgressForPrincipal("guest", "user:a", true),
      true,
    );
    assert.equal(
      canProjectFoundationProgressForPrincipal("guest", "user:a", false),
      false,
    );
    assert.equal(
      canProjectFoundationProgressForPrincipal("user:b", "user:a", true),
      false,
    );
  });

  it("rechecks revision and principal before the provider projects shared stores", () => {
    const providerSource = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/progress/progress-sync-provider.tsx",
      ),
      "utf8",
    );
    const postRequestSection = providerSource.slice(
      providerSource.indexOf("let guestAfterClaim"),
      providerSource.indexOf("} catch {", providerSource.indexOf("let guestAfterClaim")),
    );

    assert.equal(
      postRequestSection.includes("writeCanonicalProgressCache(user.id, canonical)"),
      false,
    );
    assert.match(
      postRequestSection,
      /cachedBeforeProjection[\s\S]*cachedBeforeProjection\.revision > canonical\.revision/,
    );
    assert.match(
      postRequestSection,
      /canProjectFoundationProgressForPrincipal\([\s\S]*projectionPrincipal/,
    );
    assert.match(
      postRequestSection,
      /writeMonotonicUserProgressCheckpoint\([\s\S]*applyCanonicalFoundationProgressToLegacyStores\(finalProgress/,
    );
  });

  it("accepts only an empty, epoch-advanced course reset acknowledgement", () => {
    const previous = createEmptyCanonicalFoundationProgress(importedAt);
    previous.revision = 4;
    previous.lessons["what-is-code"].completedAt = importedAt;
    const acknowledged = createEmptyCanonicalFoundationProgress(laterAt);
    acknowledged.revision = 5;
    acknowledged.courseEpoch = 1;

    assert.deepEqual(
      applyAcknowledgedFoundationProgressReset(previous, acknowledged, {
        scope: "course",
      }),
      acknowledged,
    );

    const stale = structuredClone(acknowledged);
    stale.courseEpoch = 0;
    assert.equal(
      applyAcknowledgedFoundationProgressReset(previous, stale, {
        scope: "course",
      }),
      null,
    );
    const nonEmpty = structuredClone(acknowledged);
    nonEmpty.lessons["what-is-code"].completedAt = laterAt;
    assert.equal(
      applyAcknowledgedFoundationProgressReset(previous, nonEmpty, {
        scope: "course",
      }),
      null,
    );
  });

  it("keeps other local lessons but cannot resurrect an acknowledged lesson reset", () => {
    const previous = createEmptyCanonicalFoundationProgress(importedAt);
    previous.revision = 8;
    previous.lessons["what-is-code"].completedAt = importedAt;
    previous.lessons["source-code-running-output"].completedAt = importedAt;
    const acknowledged = structuredClone(previous);
    acknowledged.revision = 9;
    acknowledged.updatedAt = laterAt;
    acknowledged.lessons["what-is-code"] =
      createEmptyCanonicalFoundationProgress(laterAt).lessons["what-is-code"];
    acknowledged.lessons["what-is-code"].lessonEpoch = 1;
    // The server did not yet have this other local-only lesson.
    acknowledged.lessons["source-code-running-output"].completedAt = null;

    const applied = applyAcknowledgedFoundationProgressReset(
      previous,
      acknowledged,
      { scope: "lesson", lessonSlug: "what-is-code" },
    );

    assert.ok(applied);
    assert.equal(applied.lessons["what-is-code"].completedAt, null);
    assert.equal(applied.lessons["what-is-code"].lessonEpoch, 1);
    assert.equal(
      applied.lessons["source-code-running-output"].completedAt,
      importedAt,
    );

    const noEpochAdvance = structuredClone(acknowledged);
    noEpochAdvance.lessons["what-is-code"].lessonEpoch = 0;
    assert.equal(
      applyAcknowledgedFoundationProgressReset(
        previous,
        noEpochAdvance,
        { scope: "lesson", lessonSlug: "what-is-code" },
      ),
      null,
    );
  });
});

describe("Progress namespaces, fingerprints, and guest reset", () => {
  it("removes a claimed guest snapshot but preserves progress created after sign-out", () => {
    const claimed = createEmptyCanonicalFoundationProgress(importedAt);
    const claimedVersion = version(claimed, "what-is-code");
    claimedVersion.completedStepsAt.launch = importedAt;
    claimedVersion.attempts.launch = { "device-a": 2 };
    claimedVersion.savedCode.remix = { value: "claimed", updatedAt: importedAt };

    const current = structuredClone(claimed);
    current.updatedAt = latestAt;
    const currentVersion = version(current, "what-is-code");
    currentVersion.completedStepsAt.flow = latestAt;
    currentVersion.attempts.launch["device-a"] = 3;
    currentVersion.savedCode.remix = { value: "new guest draft", updatedAt: latestAt };

    const residual = subtractClaimedGuestProgress(current, claimed);
    const residualVersion = version(residual, "what-is-code");
    assert.deepEqual(residualVersion.completedStepsAt, { flow: latestAt });
    assert.deepEqual(residualVersion.attempts.launch, { "device-a": 1 });
    assert.equal(residualVersion.savedCode.remix.value, "new guest draft");
  });

  it("separates guest and internal-user caches and fingerprints only current keys", () => {
    assert.notEqual(
      getCanonicalProgressStorageKey(),
      getCanonicalProgressStorageKey("user-a"),
    );
    assert.notEqual(
      getCanonicalProgressStorageKey("user-a"),
      getCanonicalProgressStorageKey("user-b"),
    );
    assert.notEqual(
      getLegacyImportFingerprintStorageKey("user-a", "device-a"),
      getLegacyImportFingerprintStorageKey("user-b", "device-a"),
    );

    const exactKey = getLessonStorageKey("what-is-code", 3);
    const first = createLegacyImportFingerprint("aggregate", { [exactKey]: "detail" });
    const reordered = createLegacyImportFingerprint("aggregate", { [exactKey]: "detail" });
    const obsoleteOnlyChanged = createLegacyImportFingerprint("aggregate", {
      [exactKey]: "detail",
      [getLessonStorageKey("what-is-code", 1)]: "ignored old detail",
    });
    const changed = createLegacyImportFingerprint("aggregate", { [exactKey]: "changed" });

    assert.equal(first, reordered);
    assert.equal(first, obsoleteOnlyChanged);
    assert.notEqual(first, changed);
  });

  it("lesson reset clears aggregate state and every detailed version for only that lesson", () => {
    const targetCurrent = getLessonStorageKey("what-is-code", 3);
    const targetOld = getLessonStorageKey("what-is-code", 1);
    const otherLesson = getLessonStorageKey("source-code-running-output", 1);
    writeLessonProgressSnapshot(targetCurrent, "current");
    writeLessonProgressSnapshot(targetOld, "old");
    writeLessonProgressSnapshot(otherLesson, "other");

    resetLessonProgress("foundations", "what-is-code");

    assert.equal(localStorage.getItem(targetCurrent), null);
    assert.equal(localStorage.getItem(targetOld), null);
    assert.equal(localStorage.getItem(otherLesson), "other");
  });

  it("course reset clears every detailed lesson version as well as aggregate progress", () => {
    for (const lesson of FOUNDATION_PROGRESS_MANIFEST) {
      writeLessonProgressSnapshot(
        getLessonStorageKey(lesson.slug, lesson.lessonVersion),
        `saved-${lesson.slug}`,
      );
      writeLessonProgressSnapshot(
        getLessonStorageKey(lesson.slug, lesson.lessonVersion + 10),
        `old-${lesson.slug}`,
      );
    }

    resetCourseProgress("foundations");

    for (const lesson of FOUNDATION_PROGRESS_MANIFEST) {
      assert.equal(
        localStorage.getItem(getLessonStorageKey(lesson.slug, lesson.lessonVersion)),
        null,
      );
      assert.equal(
        localStorage.getItem(getLessonStorageKey(lesson.slug, lesson.lessonVersion + 10)),
        null,
      );
    }
  });

  it("hydrates remote-only canonical progress into both current UI stores", () => {
    const remote = createEmptyCanonicalFoundationProgress(laterAt);
    remote.lastVisited = { value: "what-is-code", updatedAt: laterAt };
    remote.lessons["what-is-code"].completedAt = laterAt;
    const remoteVersion = version(remote, "what-is-code");
    remoteVersion.currentStep = { value: "predict", updatedAt: laterAt };
    remoteVersion.completedStepsAt = { launch: importedAt, flow: laterAt };
    remoteVersion.completedActivitiesAt = { launch: importedAt, flow: laterAt };
    remoteVersion.attempts.launch = { "device-a": 2, "device-b": 3 };
    remoteVersion.hints.launch = { "device-a": 1 };
    remoteVersion.savedCode.remix = { value: 'name = "Remote"', updatedAt: laterAt };

    assert.equal(
      applyCanonicalFoundationProgressToLegacyStores(remote, { deviceId: "device-a" }),
      true,
    );

    const collected = collectLegacyFoundationProgressFromStorage();
    const aggregate = JSON.parse(collected.aggregate);
    const detailKey = getLessonStorageKey("what-is-code", 3);
    const detail = JSON.parse(collected.detailedByStorageKey[detailKey]);

    assert.equal(aggregate.lastVisitedLesson, "what-is-code");
    assert.equal(aggregate.lessons["what-is-code"].completedAt, laterAt);
    assert.equal(aggregate.lessons["what-is-code"].stepAttempts.launch, 2);
    assert.equal(aggregate.lessons["what-is-code"].stepHints.launch, 1);
    assert.equal(detail.lessonVersion, 3);
    assert.equal(detail.currentStepId, "predict");
    assert.deepEqual(detail.completedStepIds, ["launch", "flow"]);
    assert.deepEqual(detail.practiceCompletedIds, ["launch", "flow"]);
    assert.equal(detail.attemptsByStep.launch, 2);
    assert.equal(detail.savedCodeByStep.remix, 'name = "Remote"');

    const roundTrip = convertLegacyFoundationProgress({
      ...collected,
      deviceId: "device-a",
      importedAt: latestAt,
      baseline: remote,
    });
    assert.equal(version(roundTrip, "what-is-code").attempts.launch["device-a"], 2);

    const mergedRoundTrip = mergeCanonicalFoundationProgress(remote, roundTrip);
    assert.deepEqual(version(mergedRoundTrip, "what-is-code").attempts.launch, {
      "device-a": 2,
      "device-b": 3,
    });
  });

  it("preserves hydrated code timestamps so unchanged local code cannot beat a real remote edit", () => {
    const baseline = createEmptyCanonicalFoundationProgress(importedAt);
    baseline.courseEpoch = 1;
    baseline.lessons["what-is-code"].lessonEpoch = 2;
    version(baseline, "what-is-code").savedCode.remix = {
      value: "baseline code",
      updatedAt: importedAt,
    };
    applyCanonicalFoundationProgressToLegacyStores(baseline, {
      deviceId: "device-a",
    });
    const collected = collectLegacyFoundationProgressFromStorage();
    const unchangedLocal = convertLegacyFoundationProgress({
      ...collected,
      deviceId: "device-a",
      importedAt: latestAt,
      baseline,
    });
    const concurrentRemote = structuredClone(baseline);
    concurrentRemote.updatedAt = laterAt;
    version(concurrentRemote, "what-is-code").savedCode.remix = {
      value: "real remote edit",
      updatedAt: laterAt,
    };

    assert.equal(
      version(unchangedLocal, "what-is-code").savedCode.remix.updatedAt,
      importedAt,
    );
    assert.equal(unchangedLocal.courseEpoch, 1);
    assert.equal(unchangedLocal.lessons["what-is-code"].lessonEpoch, 2);
    assert.equal(
      version(
        mergeCanonicalFoundationProgress(unchangedLocal, concurrentRemote),
        "what-is-code",
      ).savedCode.remix.value,
      "real remote edit",
    );
  });

  it("keeps canonical caches isolated by internal account ID", () => {
    const userA = createEmptyCanonicalFoundationProgress(importedAt);
    const userB = createEmptyCanonicalFoundationProgress(laterAt);
    userA.lessons["what-is-code"].completedAt = importedAt;
    userB.lessons["source-code-running-output"].completedAt = laterAt;

    assert.equal(writeCanonicalProgressCache("user-a", userA), true);
    assert.equal(writeCanonicalProgressCache("user-b", userB), true);

    const cachedA = readCanonicalProgressCache("user-a");
    const cachedB = readCanonicalProgressCache("user-b");
    assert.equal(cachedA.lessons["what-is-code"].completedAt, importedAt);
    assert.equal(cachedA.lessons["source-code-running-output"].completedAt, null);
    assert.equal(cachedB.lessons["what-is-code"].completedAt, null);
    assert.equal(cachedB.lessons["source-code-running-output"].completedAt, laterAt);

    clearCanonicalProgressCache("user-a");
    assert.equal(readCanonicalProgressCache("user-a"), null);
    assert.ok(readCanonicalProgressCache("user-b"));
  });

  it("persists one opaque random device ID without deriving browser traits", () => {
    localStorage.setItem(progressDeviceIdStorageKey, "invalid device id");
    const created = getOrCreateProgressDeviceId({
      createId: () => "device-generated-1",
    });
    const reused = getOrCreateProgressDeviceId({
      createId: () => "must-not-replace-the-stored-id",
    });

    assert.equal(created, "device-generated-1");
    assert.equal(reused, created);
    assert.equal(localStorage.getItem(progressDeviceIdStorageKey), created);
  });
});
