/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const assert = require("node:assert/strict");
const fs = require("node:fs");
const { test } = require("node:test");
const path = require("node:path");

const {
  classifyAuthError,
  isPlausibleEmail,
  maskEmail,
  normalizeEmail,
  parsePendingAuthAttempt,
} = require("../src/components/auth/auth-utils.ts");

test("normalizes plausible email input without pretending to verify an inbox", () => {
  assert.equal(normalizeEmail("  learner@example.com  "), "learner@example.com");
  assert.equal(isPlausibleEmail("learner@example.com"), true);
  assert.equal(isPlausibleEmail("learner@example"), false);
  assert.equal(isPlausibleEmail("learner @example.com"), false);
  assert.equal(isPlausibleEmail(`${"a".repeat(245)}@example.com`), false);
});

test("accepts only fresh pending OTP attempts and sanitizes their return path", () => {
  const fresh = JSON.stringify({
    createdAt: Date.now(),
    email: "learner@example.com",
    intent: "sign-up",
    next: "/lessons/what-is-code",
  });
  const unsafe = JSON.stringify({
    createdAt: Date.now(),
    email: "learner@example.com",
    intent: "sign-in",
    next: "//attacker.example",
  });
  const expired = JSON.stringify({
    createdAt: Date.now() - 31 * 60 * 1_000,
    email: "learner@example.com",
    intent: "sign-in",
    next: "/learn",
  });

  assert.equal(parsePendingAuthAttempt(fresh)?.next, "/lessons/what-is-code");
  assert.equal(parsePendingAuthAttempt(unsafe)?.next, "/learn");
  assert.equal(parsePendingAuthAttempt(expired), null);
});

test("masks account-enumeration errors and email display", () => {
  assert.equal(
    classifyAuthError({ status: 400, message: "User not found" }),
    "masked",
  );
  assert.equal(classifyAuthError({ status: 429 }), "rate-limit");
  assert.equal(classifyAuthError({ message: "Failed to fetch" }), "network");
  assert.equal(maskEmail("learner@example.com"), "le•••••@example.com");
});

test("keeps public account entry points Google-only", () => {
  const authMethodForm = fs.readFileSync(
    path.join(process.cwd(), "src/components/auth/auth-method-form.tsx"),
    "utf8",
  );
  const authShell = fs.readFileSync(
    path.join(process.cwd(), "src/components/auth/auth-shell.tsx"),
    "utf8",
  );
  const verifyEmailPage = fs.readFileSync(
    path.join(process.cwd(), "src/app/verify-email/page.tsx"),
    "utf8",
  );

  assert.match(authMethodForm, /Continue with Google/);
  assert.doesNotMatch(authMethodForm, /signInWithOtp|auth-email-form|or use email/);
  assert.doesNotMatch(authShell, /Verify your inbox|one-time code/);
  assert.match(verifyEmailPage, /redirect\("\/sign-in"\)/);
  assert.doesNotMatch(verifyEmailPage, /EmailCodeForm/);
});
