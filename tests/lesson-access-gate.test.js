/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const lessonAccess = require("../src/lib/auth/lesson-access.ts");
const supabaseServerClient = require("../src/lib/supabase/server.ts");
const { default: generateSitemap } = require("../src/app/sitemap.ts");

const lessonPagePath = (slug) =>
  path.join(process.cwd(), `src/app/lessons/${slug}/page.tsx`);

const PUBLIC_LESSON = "what-is-code";
const PROTECTED_LESSONS = [
  "source-code-running-output",
  "hardware-operating-systems-apps",
  "files-folders-extensions",
  "paths-current-folder",
  "vscode-without-getting-lost",
  "terminal-without-fear",
  "values-variables-types",
  "decisions-loops-functions",
  "input-process-output-state",
  "languages-syntax-errors",
  "interpreters-compilers-runtimes",
  "packages-dependencies-environments",
  "frontend-backend-api-database-cloud",
];

const allCurrentLessons = [
  PUBLIC_LESSON,
  ...PROTECTED_LESSONS,
];

const getLessonSources = () =>
  allCurrentLessons.map((slug) => ({
    slug,
    source: fs.readFileSync(lessonPagePath(slug), "utf8"),
  }));

const redirectTarget = (error) => {
  const digest = String(error?.digest || "");

  assert.match(digest, /NEXT_REDIRECT/);
  const next = /NEXT_REDIRECT;[^;]*;([^;]*);/u.exec(digest);

  return next?.[1] ?? "";
};

const setClient = (value) => {
  const original = supabaseServerClient.createSupabaseServerClient;

  supabaseServerClient.createSupabaseServerClient = async () => value;

  return () => {
    supabaseServerClient.createSupabaseServerClient = original;
  };
};

test("protects exactly one public lesson route and all other current lesson routes", () => {
  const lessonFiles = fs
    .readdirSync(path.join(process.cwd(), "src/app/lessons"))
    .sort();

  assert.deepEqual(lessonFiles, allCurrentLessons.slice().sort());

  const lessonSources = getLessonSources();
  for (const { slug, source } of lessonSources) {
    if (slug === PUBLIC_LESSON) {
      assert.doesNotMatch(source, /requireAuthenticatedLessonAccess/);
      continue;
    }

    assert.match(source, /requireAuthenticatedLessonAccess/);
  }
});

test("unknown lesson slugs should 404 without auth fallback", () => {
  assert.equal(
    fs.existsSync(path.join(process.cwd(), "src/app/lessons/[slug]")),
    false,
  );
});

test("legacy lesson 1 remains public and every other lesson uses server-side auth guard", async () => {
  const publicDecision = lessonAccess.getLessonPathDecision("/lessons/what-is-code");
  const protectedDecision = lessonAccess.getLessonPathDecision(
    "/lessons/source-code-running-output",
  );

  assert.equal(publicDecision.isProtected, false);
  assert.equal(publicDecision.signInPath, null);

  assert.equal(protectedDecision.isProtected, true);
  assert.equal(protectedDecision.signInPath, "/sign-in?next=%2Flessons%2Fsource-code-running-output");
});

test("sitemap exposes only the public lesson URL", () => {
  const entries = generateSitemap();
  const lessonPaths = entries
    .map((entry) => new URL(entry.url).pathname)
    .filter((entryPath) => entryPath.startsWith("/lessons/"));

  assert.equal(lessonPaths.length, 1);
  assert.equal(lessonPaths[0], "/lessons/what-is-code");

  for (const protectedLesson of PROTECTED_LESSONS) {
    assert.equal(lessonPaths.includes(`/lessons/${protectedLesson}`), false);
  }
});

test("normalizes trailing slash and blocks lookalike lesson prefixes", () => {
  const trailingSlash = lessonAccess.getLessonPathDecision("/lessons/input-process-output-state/");
  const lookalike = lessonAccess.getLessonPathDecision("/lessons/what-is-code-extra");

  assert.equal(trailingSlash.lessonPath, "/lessons/input-process-output-state");
  assert.equal(
    trailingSlash.signInPath,
    "/sign-in?next=%2Flessons%2Finput-process-output-state",
  );

  assert.equal(lookalike.isProtected, true);
  assert.equal(lookalike.signInPath, "/sign-in?next=%2Flessons%2Fwhat-is-code-extra");
});

test("allows only Google provider from server-owned app metadata", () => {
  assert.equal(
    lessonAccess.isAuthenticatedGoogleSession({
      sub: "user-id",
      role: "authenticated",
      is_anonymous: false,
      app_metadata: { providers: ["google"], provider: "email" },
    }),
    false,
  );

  assert.equal(
    lessonAccess.isAuthenticatedGoogleSession({
      sub: "user-id",
      role: "authenticated",
      app_metadata: { provider: "google" },
    }),
    true,
  );

  assert.equal(
    lessonAccess.isAuthenticatedGoogleSession({
      sub: "user-id",
      role: "authenticated",
      app_metadata: {},
      user_metadata: { provider: "google" },
    }),
    false,
  );
});

test("permits a valid Google-authenticated session", async () => {
  let claimsCalls = 0;

  const resetClient = setClient({
    auth: {
      getClaims: async () => {
        claimsCalls += 1;

        return {
          data: {
            claims: {
              sub: "user-id",
              role: "authenticated",
              is_anonymous: false,
              app_metadata: {
                provider: "google",
                providers: ["google"],
              },
            },
          },
        };
      },
    },
  });

  try {
    await lessonAccess.requireAuthenticatedLessonAccess("/lessons/interpreters-compilers-runtimes");
    assert.equal(claimsCalls, 1);
  } finally {
    resetClient();
  }
});

test("rejects malformed, missing, invalid, anonymous, non-google, and auth-error lesson sessions", async () => {
  const lessonPath = "/lessons/interpreters-compilers-runtimes";

  const cases = [
    { claims: null, name: "missing-auth-client" },
    { claims: { error: "session missing", data: {} }, name: "auth-error" },
    { claims: { data: { claims: { role: "authenticated" } } }, name: "missing-sub" },
    { claims: { data: { claims: { sub: "user-id", role: "viewer" } } }, name: "wrong-role" },
    {
      claims: {
        data: {
          claims: {
            sub: "user-id",
            role: "authenticated",
            is_anonymous: true,
          },
        },
      },
      name: "anonymous",
    },
    {
      claims: {
        data: {
          claims: {
            sub: "user-id",
            role: "authenticated",
            app_metadata: { provider: "github" },
          },
        },
      },
      name: "non-google",
    },
  ];

  for (const { claims, name } of cases) {
    if (claims === null) {
      const resetClient = setClient(null);
      try {
        await lessonAccess.requireAuthenticatedLessonAccess(lessonPath);
        assert.fail(`expected redirect for ${name}`);
      } catch (error) {
        assert.equal(redirectTarget(error), "/sign-in?next=%2Flessons%2Finterpreters-compilers-runtimes");
      } finally {
        resetClient();
      }

      continue;
    }

    const resetClient = setClient({
      auth: {
        getClaims: async () => claims,
      },
    });

    try {
      await lessonAccess.requireAuthenticatedLessonAccess(lessonPath);
      assert.fail(`expected redirect for ${name}`);
    } catch (error) {
      assert.equal(redirectTarget(error), "/sign-in?next=%2Flessons%2Finterpreters-compilers-runtimes");
    } finally {
      resetClient();
    }
  }

  const resetClient = setClient({
    auth: {
      getClaims: async () => {
        throw new Error("token expired");
      },
    },
  });

  try {
    await lessonAccess.requireAuthenticatedLessonAccess(lessonPath);
    assert.fail("expected redirect for auth error");
  } catch (error) {
    assert.equal(redirectTarget(error), "/sign-in?next=%2Flessons%2Finterpreters-compilers-runtimes");
  } finally {
    resetClient();
  }
});

test("rejects unsafe lesson paths and keeps same-origin fallback for return target", () => {
  const unsafeDecision = lessonAccess.getLessonPathDecision("/lessons/..%2F\\bad");
  assert.equal(unsafeDecision.signInPath, "/sign-in?next=%2Flearn");
});

test("does not let preview review flag bypass authentication", async () => {
  const restore = Object.hasOwn(process.env, "NEXT_PUBLIC_UNLOCK_PUBLISHED_LESSONS")
    ? process.env.NEXT_PUBLIC_UNLOCK_PUBLISHED_LESSONS
    : undefined;

  process.env.NEXT_PUBLIC_UNLOCK_PUBLISHED_LESSONS = "true";

  const resetClient = setClient(null);
  try {
    assert.equal(lessonAccess.isProtectedLessonRoute("/lessons/input-process-output-state"), true);

    try {
      await lessonAccess.requireAuthenticatedLessonAccess("/lessons/input-process-output-state");
      assert.fail("expected redirect while review flag is enabled");
    } catch (error) {
      assert.equal(redirectTarget(error), "/sign-in?next=%2Flessons%2Finput-process-output-state");
    }
  } finally {
    if (typeof restore === "undefined") {
      delete process.env.NEXT_PUBLIC_UNLOCK_PUBLISHED_LESSONS;
    } else {
      process.env.NEXT_PUBLIC_UNLOCK_PUBLISHED_LESSONS = restore;
    }

    resetClient();
  }
});
