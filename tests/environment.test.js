/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  resolveCurriculumReviewMode,
} = require("../src/lib/environment.ts");
const {
  isStagingCoursePreviewHost,
  shouldUseRemoteProgressSync,
} = require("../src/lib/staging-preview.ts");

test("opens published lessons in Vercel preview and local development environments", () => {
  assert.equal(
    resolveCurriculumReviewMode({ vercelEnvironment: "preview" }),
    true,
  );
  assert.equal(
    resolveCurriculumReviewMode({ nodeEnvironment: "development" }),
    true,
  );
});

test("keeps the guided lesson sequence locked in production", () => {
  assert.equal(
    resolveCurriculumReviewMode({
      nodeEnvironment: "production",
      vercelEnvironment: "production",
    }),
    false,
  );
});

test("allows an explicit environment flag while preserving an explicit production off switch", () => {
  assert.equal(
    resolveCurriculumReviewMode({
      explicitReview: "true",
      vercelEnvironment: "production",
    }),
    true,
  );
  assert.equal(
    resolveCurriculumReviewMode({
      explicitReview: "false",
      nodeEnvironment: "development",
      vercelEnvironment: "preview",
    }),
    false,
  );
});

test("recognizes only the exact staging preview hostname", () => {
  assert.equal(isStagingCoursePreviewHost("staging.vibe-to-code.tech"), true);
  assert.equal(isStagingCoursePreviewHost("STAGING.VIBE-TO-CODE.TECH:443"), true);
  assert.equal(isStagingCoursePreviewHost("vibe-to-code.tech"), false);
  assert.equal(
    isStagingCoursePreviewHost("staging.vibe-to-code.tech.attacker.example"),
    false,
  );
  assert.equal(
    isStagingCoursePreviewHost(
      "vibe-to-code-git-develop-medhirlokhande99-4313s-projects.vercel.app",
    ),
    false,
  );
});

test("forces staging preview progress to stay device-only", () => {
  assert.equal(
    shouldUseRemoteProgressSync(true, "staging.vibe-to-code.tech"),
    false,
  );
  assert.equal(shouldUseRemoteProgressSync(true, "vibe-to-code.tech"), true);
  assert.equal(shouldUseRemoteProgressSync(false, "vibe-to-code.tech"), false);
});
