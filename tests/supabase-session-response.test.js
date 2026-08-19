/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { NextRequest } = require("next/server");

const {
  createSupabaseSessionResponse,
} = require("../src/lib/supabase/update-session.ts");

test("copies Supabase anti-cache headers when refreshed auth cookies are set", () => {
  const request = new NextRequest("https://staging.vibe-to-code.tech/account");
  const response = createSupabaseSessionResponse(
    request,
    [
      {
        name: "sb-test-auth-token",
        value: "refreshed-session",
        options: { path: "/", sameSite: "lax" },
      },
    ],
    {
      "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
      Expires: "0",
      Pragma: "no-cache",
    },
  );

  assert.equal(
    response.headers.get("cache-control"),
    "private, no-cache, no-store, must-revalidate, max-age=0",
  );
  assert.equal(response.headers.get("expires"), "0");
  assert.equal(response.headers.get("pragma"), "no-cache");
  assert.equal(request.cookies.get("sb-test-auth-token")?.value, "refreshed-session");
  assert.match(
    response.headers.get("set-cookie") ?? "",
    /sb-test-auth-token=refreshed-session/,
  );
});

test("sets refreshed cookies when Supabase does not provide response headers", () => {
  const request = new NextRequest("https://vibe-to-code.tech/account");
  const response = createSupabaseSessionResponse(request, [
    {
      name: "sb-test-auth-token",
      value: "refreshed-session",
      options: { path: "/", sameSite: "lax" },
    },
  ]);

  assert.match(
    response.headers.get("set-cookie") ?? "",
    /sb-test-auth-token=refreshed-session/,
  );
});
