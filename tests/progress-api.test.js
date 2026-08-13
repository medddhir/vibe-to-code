/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  createEmptyCanonicalFoundationProgress,
} = require("../src/lib/progress-sync.ts");
const {
  parseProgressSyncRequest,
  progressResetRequestSchema,
} = require("../src/lib/progress-api.ts");

const now = "2026-08-12T12:00:00.000Z";

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
