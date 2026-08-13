/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const {
  FOUNDATION_PROGRESS_MANIFEST,
} = require("../src/lib/progress-manifest.ts");

const migration = fs.readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20260813130833_accounts_and_progress.sql",
  ),
  "utf8",
);
const defaultPrivilegeMigration = fs.readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20260813131323_harden_function_default_privileges.sql",
  ),
  "utf8",
);
const privateManifestRlsMigration = fs.readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20260813131731_enable_private_manifest_rls.sql",
  ),
  "utf8",
);

test("hardens legacy public-schema default privileges before creating app objects", () => {
  const firstTable = migration.indexOf("create table public.profiles");
  const tableDefaults = migration.indexOf(
    "alter default privileges for role postgres in schema public\n  revoke all privileges on tables from anon, authenticated, service_role;",
  );
  const sequenceDefaults = migration.indexOf(
    "alter default privileges for role postgres in schema public\n  revoke all privileges on sequences from anon, authenticated, service_role;",
  );
  const functionDefaults = migration.indexOf(
    "alter default privileges for role postgres in schema public\n  revoke execute on functions from public, anon, authenticated, service_role;",
  );

  assert.ok(tableDefaults >= 0 && tableDefaults < firstTable);
  assert.ok(sequenceDefaults >= 0 && sequenceDefaults < firstTable);
  assert.ok(functionDefaults >= 0 && functionDefaults < firstTable);
  assert.match(
    migration,
    /revoke all privileges on sequence public\.email_preference_events_id_seq\s+from public, anon, authenticated, service_role;/,
  );
  assert.match(
    migration,
    /alter default privileges for role postgres in schema private\s+revoke execute on functions from public, anon, authenticated, service_role;/,
  );
  assert.match(
    migration,
    /if to_regprocedure\('public\.rls_auto_enable\(\)'\) is not null then\s+execute 'revoke execute on function public\.rls_auto_enable\(\) from public, anon, authenticated';/,
  );
});

test("does not expose direct profile mutations before a verified RPC exists", () => {
  assert.doesNotMatch(migration, /create policy "profiles_update_own"/);
  assert.doesNotMatch(migration, /grant update \(display_name\) on public\.profiles/);
});

test("removes PostgreSQL's global PUBLIC function execution default", () => {
  assert.equal(
    defaultPrivilegeMigration.trim(),
    "alter default privileges for role postgres revoke execute on functions from public;",
  );
});

test("enables defense-in-depth RLS on the private validation manifest", () => {
  assert.equal(
    privateManifestRlsMigration.trim(),
    "alter table private.curriculum_progress_ids enable row level security;",
  );
});

test("SQL progress allowlist contains every canonical manifest ID", () => {
  for (const lesson of FOUNDATION_PROGRESS_MANIFEST) {
    assert.match(migration, new RegExp(`'${lesson.slug}'`));

    for (const progressId of [...lesson.stepIds, ...lesson.activityIds]) {
      assert.match(
        migration,
        new RegExp(`'${progressId}'`),
        `SQL allowlist is missing ${lesson.slug}:${progressId}`,
      );
    }
  }
});

test("private mutations require verified non-anonymous identities", () => {
  const guardCalls = migration.match(
    /if not private\.is_verified_non_anonymous_authenticated\(\) then/g,
  );

  assert.equal(guardCalls?.length, 3);
  assert.match(migration, /auth_user\.email_confirmed_at is not null/);
  assert.match(migration, /auth\.jwt\(\) ->> 'is_anonymous'/);
});

test("SQL enforces canonical payload and idempotency bounds", () => {
  assert.match(migration, /private\.utf16_code_units\(saved_code\) > 10000/);
  assert.match(migration, /octet_length\(convert_to\(saved_code, 'UTF8'\)\) > 40000/);
  assert.match(migration, /component_entry\.key !~ '\^\[A-Za-z0-9\._:-\]\{1,128\}\$'/);
  assert.match(migration, /private\.is_valid_progress_lesson\(/);
  assert.match(migration, /p_value::timestamptz > now\(\) \+ interval '24 hours'/);
  assert.match(migration, /now\(\) \+ interval '30 days'/);
  assert.match(migration, /Reset receipts never expire/);
});
