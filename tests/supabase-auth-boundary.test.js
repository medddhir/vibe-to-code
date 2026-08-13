/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  getSupabasePublicConfig,
  isSupabaseConfigured,
} = require("../src/lib/supabase/config.ts");
const {
  isSafeReturnPath,
  resolveSafeReturnPath,
} = require("../src/lib/supabase/return-path.ts");

test("requires both valid public Supabase settings", () => {
  assert.equal(getSupabasePublicConfig({}), null);
  assert.equal(
    getSupabasePublicConfig({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    }),
    null,
  );
  assert.equal(
    getSupabasePublicConfig({
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      NEXT_PUBLIC_SUPABASE_URL: "not a url",
    }),
    null,
  );
  assert.equal(
    isSupabaseConfigured({
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      NEXT_PUBLIC_SUPABASE_URL: "ftp://example.supabase.co",
    }),
    false,
  );
});

test("normalizes configured public Supabase settings", () => {
  assert.deepEqual(
    getSupabasePublicConfig({
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "  sb_publishable_test  ",
      NEXT_PUBLIC_SUPABASE_URL: "  https://example.supabase.co/  ",
    }),
    {
      publishableKey: "sb_publishable_test",
      url: "https://example.supabase.co",
    },
  );

  assert.deepEqual(
    getSupabasePublicConfig({
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    }),
    {
      publishableKey: "sb_publishable_local",
      url: "http://127.0.0.1:54321",
    },
  );
});

test("rejects insecure remote and non-root Supabase endpoints", () => {
  const invalidUrls = [
    "http://example.supabase.co",
    "https://user:secret@example.supabase.co",
    "https://example.supabase.co/rest/v1",
    "https://example.supabase.co?token=secret",
  ];

  invalidUrls.forEach((url) => {
    assert.equal(
      getSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
        NEXT_PUBLIC_SUPABASE_URL: url,
      }),
      null,
    );
  });
});

test("accepts same-site relative return paths", () => {
  const safePaths = [
    "/",
    "/learn",
    "/courses/foundations?lesson=variables#practice",
    "/account?next=https://example.com",
  ];

  safePaths.forEach((path) => assert.equal(isSafeReturnPath(path), true));
  assert.equal(
    resolveSafeReturnPath("/courses/foundations?lesson=variables"),
    "/courses/foundations?lesson=variables",
  );
});

test("rejects absolute, protocol-relative, encoded, and malformed return paths", () => {
  const unsafePaths = [
    "https://attacker.example",
    "//attacker.example/path",
    "/\\attacker.example/path",
    "/%2F%2Fattacker.example/path",
    "/%252F%252Fattacker.example/path",
    "/%5Cattacker.example/path",
    "/line\nbreak",
    "/bad%escape",
    "learn",
    "",
  ];

  unsafePaths.forEach((path) => assert.equal(isSafeReturnPath(path), false));
  assert.equal(resolveSafeReturnPath("//attacker.example"), "/learn");
  assert.equal(resolveSafeReturnPath(null), "/learn");
  assert.equal(resolveSafeReturnPath("//attacker.example", "//also.bad"), "/learn");
});
