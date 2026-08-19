/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  createOAuthCallbackRedirect,
  getOAuthFlowOptions,
} = require("../src/app/auth/callback/route.ts");

test("preserves the Supabase PKCE flow identifier during OAuth exchange", () => {
  const url = new URL(
    "https://vibe-to-code.tech/auth/callback?code=oauth-code&sb_flow_id=flow-123",
  );

  assert.deepEqual(getOAuthFlowOptions(url), { flowId: "flow-123" });
});

test("omits OAuth flow options when Supabase does not send a flow identifier", () => {
  const url = new URL("https://vibe-to-code.tech/auth/callback?code=oauth-code");

  assert.equal(getOAuthFlowOptions(url), undefined);
});

test("marks OAuth callback redirects private and non-cacheable", () => {
  const response = createOAuthCallbackRedirect(
    new URL("https://staging.vibe-to-code.tech/learn"),
  );

  assert.equal(response.status, 307);
  assert.equal(
    response.headers.get("cache-control"),
    "private, no-cache, no-store, must-revalidate, max-age=0",
  );
  assert.equal(response.headers.get("expires"), "0");
  assert.equal(response.headers.get("pragma"), "no-cache");
  assert.equal(
    response.headers.get("location"),
    "https://staging.vibe-to-code.tech/learn",
  );
});
