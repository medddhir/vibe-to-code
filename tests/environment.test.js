/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  resolveCurriculumReviewMode,
} = require("../src/lib/environment.ts");

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
