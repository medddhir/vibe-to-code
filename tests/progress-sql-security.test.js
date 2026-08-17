/* eslint-disable @typescript-eslint/no-require-imports */
require("./test-support");

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const {
  FOUNDATION_PROGRESS_MANIFEST,
} = require("../src/lib/progress-manifest.ts");

const migrationsDirectory = path.join(process.cwd(), "supabase/migrations");
const migrationFiles = fs.readdirSync(migrationsDirectory)
  .filter((file) => file.endsWith(".sql"))
  .sort();
const migrationHistory = migrationFiles.map((file) => ({
  file,
  sql: fs.readFileSync(path.join(migrationsDirectory, file), "utf8"),
}));
const migration = migrationHistory.find(
  ({ file }) => file === "20260813130833_accounts_and_progress.sql",
).sql;
const version3Migration = migrationHistory.find(
  ({ file }) => file.endsWith("_add_foundations_lesson_15_manifest.sql"),
);
const version4Migration = migrationHistory.find(
  ({ file }) => file.endsWith("_publish_foundations_level_2.sql"),
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

function sqlManifest(sql) {
  const start = sql.indexOf("with manifest (lesson_slug, step_ids, activity_ids) as (");
  const end = sql.indexOf("), manifest_ids as (", start);
  assert.ok(start >= 0 && end > start, "SQL manifest CTE is missing");
  const section = sql.slice(start, end);
  const entries = [];
  const pattern = /\(\s*'([^']+)',\s*array\[([^\]]*)\]::text\[\],\s*array\[([^\]]*)\]::text\[\]\s*\)/g;
  for (const match of section.matchAll(pattern)) {
    const strings = (value) => [...value.matchAll(/'([^']+)'/g)].map((item) => item[1]);
    entries.push({ slug: match[1], stepIds: strings(match[2]), activityIds: strings(match[3]) });
  }
  return entries;
}

function curriculumRows(sql, version) {
  return [...sql.matchAll(new RegExp(
    `\\('foundations', ${version}, '([^']+)', (\\d+), (\\d+)\\)`,
    "g",
  ))].map((match) => ({ slug: match[1], order: Number(match[2]), lessonVersion: Number(match[3]) }));
}

test("sorted SQL history preserves versions 2 and 3 and adds the exact version-4 manifest", () => {
  assert.equal(migrationFiles.at(-1), version4Migration.file);
  const version2Lessons = curriculumRows(migration, 2);
  const version3Lessons = curriculumRows(version3Migration.sql, 3);
  const version4Lessons = curriculumRows(version4Migration.sql, 4);
  const version2Ids = sqlManifest(migration);
  const version3Ids = sqlManifest(version3Migration.sql);
  const version4Ids = sqlManifest(version4Migration.sql);
  const countIds = (entries) => entries.reduce(
    (total, lesson) => total + lesson.stepIds.length + lesson.activityIds.length,
    0,
  );

  assert.equal(version2Lessons.length, 14);
  assert.equal(countIds(version2Ids), 99);
  assert.equal(version3Lessons.length, 15);
  assert.equal(countIds(version3Ids), 108);
  assert.equal(version4Lessons.length, 23);
  assert.equal(countIds(version4Ids), 180);
  assert.deepEqual(version4Lessons.map((lesson) => lesson.slug), FOUNDATION_PROGRESS_MANIFEST.map((lesson) => lesson.slug));
  assert.deepEqual(version4Ids, FOUNDATION_PROGRESS_MANIFEST.map((lesson) => ({
    slug: lesson.slug,
    stepIds: [...lesson.stepIds],
    activityIds: [...lesson.activityIds],
  })));
  assert.doesNotMatch(version3Migration.sql, /update\s+public\.learner_course_progress/i);
  assert.doesNotMatch(version3Migration.sql, /progress_sync_requests\s+(?:set|values)/i);
  assert.doesNotMatch(version4Migration.sql, /update\s+public\.learner_course_progress/i);
  assert.doesNotMatch(version4Migration.sql, /progress_sync_requests\s+(?:set|values)/i);
  assert.equal(
    crypto.createHash("sha256").update(migration).digest("hex"),
    "791b372e9d257bd5a7133d27840e7b81f1ac381722ed9a04ced63509ed03fd4c",
  );
  assert.equal(
    crypto.createHash("sha256").update(version3Migration.sql).digest("hex"),
    "b061d9d3beb7ac6f6af87caf879094b0d21b0505abce15e1513e119c0cd6ba05",
  );
});

test("version-3 migration fails closed before inserts when learner data exists", () => {
  const sql = version3Migration.sql;
  const guard = sql.indexOf("do $$");
  const guardEnd = sql.indexOf("$$;", guard);
  const curriculumInsert = sql.indexOf("insert into public.curriculum_lessons");
  const progressIdsInsert = sql.indexOf("insert into private.curriculum_progress_ids");

  assert.ok(guard >= 0 && guardEnd > guard);
  assert.match(
    sql.slice(guard, guardEnd),
    /exists \(select 1 from public\.learner_course_progress\)/,
  );
  assert.match(
    sql.slice(guard, guardEnd),
    /exists \(select 1 from public\.progress_sync_requests\)/,
  );
  assert.match(
    sql.slice(guard, guardEnd),
    /Foundations curriculum v3 requires reviewed learner-progress migration/,
  );
  assert.ok(curriculumInsert > guardEnd);
  assert.ok(progressIdsInsert > guardEnd);
  assert.doesNotMatch(sql, /(?:update|delete\s+from)\s+public\.learner_course_progress/i);
  assert.doesNotMatch(sql, /(?:update|delete\s+from)\s+public\.progress_sync_requests/i);

  assert.equal(curriculumRows(migration, 2).length, 14);
  assert.equal(curriculumRows(sql, 3).length, 15);
  assert.equal(
    sqlManifest(sql).reduce(
      (total, lesson) => total + lesson.stepIds.length + lesson.activityIds.length,
      0,
    ),
    108,
  );
});

test("version-4 migration fails closed before curriculum and progress-ID inserts", () => {
  const sql = version4Migration.sql;
  const guard = sql.indexOf("do $$");
  const guardEnd = sql.indexOf("$$;", guard);
  const curriculumInsert = sql.indexOf("insert into public.curriculum_lessons");
  const progressIdsInsert = sql.indexOf("insert into private.curriculum_progress_ids");

  assert.ok(guard >= 0 && guardEnd > guard);
  assert.match(sql.slice(guard, guardEnd), /exists \(select 1 from public\.learner_course_progress\)/);
  assert.match(sql.slice(guard, guardEnd), /exists \(select 1 from public\.progress_sync_requests\)/);
  assert.match(sql.slice(guard, guardEnd), /Foundations curriculum v4 requires reviewed learner-progress migration/);
  assert.ok(curriculumInsert > guardEnd);
  assert.ok(progressIdsInsert > curriculumInsert);
  assert.equal(curriculumRows(sql, 4).length, 23);
  assert.equal(
    sqlManifest(sql).reduce((total, lesson) => total + lesson.stepIds.length + lesson.activityIds.length, 0),
    180,
  );
});

test("SQL progress allowlist contains every canonical manifest ID", () => {
  for (const lesson of FOUNDATION_PROGRESS_MANIFEST) {
    assert.match(version4Migration.sql, new RegExp(`'${lesson.slug}'`));

    for (const progressId of [...lesson.stepIds, ...lesson.activityIds]) {
      assert.match(
        version4Migration.sql,
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
