/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  hasJsonContentType,
  isBodyWithinLimit,
  isSameOriginMutation,
  isUuid,
} = require("../src/lib/api/request-security.ts");

test("accepts only exact same-origin browser mutations", () => {
  const valid = new Request("https://staging.vibe-to-code.tech/api/progress", {
    method: "PUT",
    headers: {
      origin: "https://staging.vibe-to-code.tech",
      "sec-fetch-site": "same-origin",
    },
  });
  const crossSubdomain = new Request("https://vibe-to-code.tech/api/progress", {
    method: "PUT",
    headers: {
      origin: "https://staging.vibe-to-code.tech",
      "sec-fetch-site": "same-site",
    },
  });
  const missingOrigin = new Request("https://staging.vibe-to-code.tech/api/progress", {
    method: "PUT",
  });

  assert.equal(isSameOriginMutation(valid), true);
  assert.equal(isSameOriginMutation(crossSubdomain), false);
  assert.equal(isSameOriginMutation(missingOrigin), false);
});

test("validates JSON content type and declared body limits", () => {
  const json = new Request("https://example.test/api", {
    headers: {
      "content-length": "128",
      "content-type": "application/json; charset=utf-8",
    },
  });
  const tooLarge = new Request("https://example.test/api", {
    headers: { "content-length": "2049" },
  });

  assert.equal(hasJsonContentType(json), true);
  assert.equal(isBodyWithinLimit(json, 2048), true);
  assert.equal(isBodyWithinLimit(tooLarge, 2048), false);
});

test("accepts canonical UUIDs and rejects arbitrary idempotency values", () => {
  assert.equal(isUuid("b7a71c4a-9f84-4a4c-8f5d-132abf73d8dd"), true);
  assert.equal(isUuid("not-a-uuid"), false);
  assert.equal(isUuid(null), false);
});
