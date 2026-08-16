/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  createEmptyCanonicalFoundationProgress,
  parseCanonicalFoundationProgress,
} = require("../src/lib/progress-sync.ts");
const {
  parseProgressSyncRequest,
  progressResetRequestSchema,
} = require("../src/lib/progress-api.ts");

const now = "2026-08-12T12:00:00.000Z";

function createVersion2Progress() {
  const payload = createEmptyCanonicalFoundationProgress(now);
  payload.curriculumVersion = 2;
  delete payload.lessons["internet-web-browser-server"];
  payload.courseEpoch = 4;
  payload.revision = 9;
  payload.lessons["frontend-backend-api-database-cloud"].completedAt = now;
  return payload;
}

test("accepts a canonical progress request whose concurrency fields match", () => {
  const payload = createEmptyCanonicalFoundationProgress(now);
  assert.ok(parseProgressSyncRequest({
    source: "legacy-v1-import",
    baseRevision: 0,
    courseEpoch: 0,
    payload,
  }));
});

test("rejects progress requests with mismatched revisions or extra fields", () => {
  const payload = createEmptyCanonicalFoundationProgress(now);
  assert.equal(parseProgressSyncRequest({
    source: "local-v2",
    baseRevision: 1,
    courseEpoch: 0,
    payload,
  }), null);
  assert.equal(parseProgressSyncRequest({
    source: "local-v2",
    baseRevision: 0,
    courseEpoch: 0,
    payload,
    userId: "another-user",
  }), null);
});

test("keeps trusted v2 normalization lossless while rejecting raw v2 API writes", () => {
  const version2 = createVersion2Progress();
  const normalized = parseCanonicalFoundationProgress(version2);

  assert.equal(normalized.curriculumVersion, 3);
  assert.equal(normalized.courseEpoch, version2.courseEpoch);
  assert.equal(normalized.revision, version2.revision);
  assert.deepEqual(
    normalized.lessons["frontend-backend-api-database-cloud"],
    version2.lessons["frontend-backend-api-database-cloud"],
  );
  assert.equal(parseProgressSyncRequest({
    source: "local-v2",
    baseRevision: version2.revision,
    courseEpoch: version2.courseEpoch,
    payload: version2,
  }), null);
});

test("accepts current Lesson 15 progress and a stale v2 request cannot replace it", () => {
  const current = createEmptyCanonicalFoundationProgress(now);
  const lesson15 = current.lessons["internet-web-browser-server"];
  lesson15.completedAt = now;
  lesson15.versions["1"].completedActivitiesAt["order-page-journey"] = now;

  const accepted = parseProgressSyncRequest({
    source: "retry",
    baseRevision: 0,
    courseEpoch: 0,
    payload: current,
  });
  assert.ok(accepted);
  assert.equal(
    accepted.payload.lessons["internet-web-browser-server"].completedAt,
    now,
  );

  let stored = structuredClone(accepted.payload);
  const stale = createVersion2Progress();
  const rejected = parseProgressSyncRequest({
    source: "local-v2",
    baseRevision: stale.revision,
    courseEpoch: stale.courseEpoch,
    payload: stale,
  });
  if (rejected) stored = rejected.payload;

  assert.equal(rejected, null);
  assert.equal(stored.lessons["internet-web-browser-server"].completedAt, now);
});

test("validates reset scope and known lesson slugs", () => {
  assert.equal(progressResetRequestSchema.safeParse({ scope: "course" }).success, true);
  assert.equal(progressResetRequestSchema.safeParse({
    scope: "lesson",
    lessonSlug: "what-is-code",
  }).success, true);
  assert.equal(progressResetRequestSchema.safeParse({
    scope: "lesson",
    lessonSlug: "invented-lesson",
  }).success, false);
});
