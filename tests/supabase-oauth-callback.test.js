/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  createOAuthCallbackRedirect,
  getOAuthFlowOptions,
  hasOAuthVerifierCookie,
} = require("../src/app/auth/callback/route.ts");
const {
  getOAuthStartParams,
} = require("../src/app/auth/google/route.ts");

test("starts Google OAuth with a sanitized return path", () => {
  assert.deepEqual(
    getOAuthStartParams(
      new URL(
        "https://vibe-to-code.tech/auth/google?intent=sign-in&next=%2Flessons%2Fsource-code-running-output",
      ),
    ),
    { intent: "sign-in", next: "/lessons/source-code-running-output" },
  );
  assert.deepEqual(
    getOAuthStartParams(
      new URL(
        "https://vibe-to-code.tech/auth/google?intent=sign-up&next=https%3A%2F%2Fattacker.example",
      ),
    ),
    { intent: "sign-up", next: "/courses/foundations" },
  );
});

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

test("detects the Supabase PKCE verifier cookie without reading its value", () => {
  const request = {
    cookies: {
      getAll: () => [
        { name: "unrelated", value: "ignored" },
        {
          name: "sb-project-auth-token-code-verifier",
          value: "must-not-be-logged",
        },
      ],
    },
  };

  assert.equal(hasOAuthVerifierCookie(request), true);
  assert.equal(
    hasOAuthVerifierCookie({ cookies: { getAll: () => [] } }),
    false,
  );
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
