-- Vibe to Code account and learning-progress boundary.
-- Apply to staging first. Production must use a separate Supabase project.

create extension if not exists pgcrypto with schema extensions;

-- This project predates Supabase's safer Data API defaults. Remove its broad
-- postgres-owned public-schema ACLs before creating any application object.
-- Client and service roles receive only the per-object privileges granted at
-- the end of this migration.
alter default privileges for role postgres in schema public
  revoke all privileges on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all privileges on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;

create schema if not exists private;
revoke all on schema private from public;
alter default privileges for role postgres in schema private
  revoke execute on functions from public, anon, authenticated, service_role;

-- This platform-provisioned event-trigger function is internal RLS plumbing,
-- not a Data API RPC. Keep the postgres/service-role path unchanged while
-- removing direct browser-client execution flagged by Security Advisor.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.email_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  marketing_enabled boolean not null default false,
  consented_at timestamptz,
  revoked_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.email_preference_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  marketing_enabled boolean not null,
  policy_version text not null,
  recorded_at timestamptz not null default now()
);

create index email_preference_events_user_id_recorded_at_idx
  on public.email_preference_events (user_id, recorded_at desc);

create table public.curriculum_lessons (
  course_slug text not null,
  curriculum_version integer not null check (curriculum_version > 0),
  lesson_slug text not null,
  lesson_order integer not null check (lesson_order > 0),
  lesson_version integer not null check (lesson_version > 0),
  primary key (course_slug, curriculum_version, lesson_slug),
  unique (course_slug, curriculum_version, lesson_order),
  check (course_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  check (lesson_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

insert into public.curriculum_lessons
  (course_slug, curriculum_version, lesson_slug, lesson_order, lesson_version)
values
  ('foundations', 2, 'what-is-code', 1, 3),
  ('foundations', 2, 'source-code-running-output', 2, 1),
  ('foundations', 2, 'hardware-operating-systems-apps', 3, 1),
  ('foundations', 2, 'files-folders-extensions', 4, 1),
  ('foundations', 2, 'paths-current-folder', 5, 1),
  ('foundations', 2, 'vscode-without-getting-lost', 6, 1),
  ('foundations', 2, 'terminal-without-fear', 7, 1),
  ('foundations', 2, 'values-variables-types', 8, 1),
  ('foundations', 2, 'decisions-loops-functions', 9, 1),
  ('foundations', 2, 'input-process-output-state', 10, 1),
  ('foundations', 2, 'languages-syntax-errors', 11, 1),
  ('foundations', 2, 'interpreters-compilers-runtimes', 12, 1),
  ('foundations', 2, 'packages-dependencies-environments', 13, 1),
  ('foundations', 2, 'frontend-backend-api-database-cloud', 14, 1)
on conflict (course_slug, curriculum_version, lesson_slug) do update
set
  lesson_order = excluded.lesson_order,
  lesson_version = excluded.lesson_version;

-- Server-side allowlist for every ID that can appear inside a canonical
-- progress document. This mirrors src/lib/progress-manifest.ts and is kept in
-- the unexposed private schema so direct RPC callers cannot invent progress
-- keys that the application does not understand.
create table private.curriculum_progress_ids (
  course_slug text not null,
  curriculum_version integer not null,
  lesson_slug text not null,
  progress_id text not null,
  id_kind text not null check (id_kind in ('step', 'activity')),
  primary key (
    course_slug,
    curriculum_version,
    lesson_slug,
    progress_id
  ),
  foreign key (course_slug, curriculum_version, lesson_slug)
    references public.curriculum_lessons (
      course_slug,
      curriculum_version,
      lesson_slug
    )
    on delete cascade,
  check (char_length(progress_id) between 1 and 128),
  check (progress_id ~ '^[A-Za-z0-9._:-]+$')
);

with manifest (lesson_slug, step_ids, activity_ids) as (
  values
    ('what-is-code', array['launch', 'flow', 'predict', 'remix', 'debug', 'verify']::text[], array[]::text[]),
    ('source-code-running-output', array['three-forms', 'save-run-loop', 'stale-output', 'repair-workflow', 'transfer-model']::text[], array[]::text[]),
    ('hardware-operating-systems-apps', array['stack-sort', 'os-job', 'browser-website', 'failure-layer', 'stack-transfer']::text[], array[]::text[]),
    ('files-folders-extensions', array['file-folder-model', 'build-project-tree', 'extension-trap', 'extension-jobs', 'organize-transfer']::text[], array[]::text[]),
    ('paths-current-folder', array['path-model', 'same-folder', 'move-up', 'case-slashes', 'path-transfer']::text[], array[]::text[]),
    ('vscode-without-getting-lost', array['panel-map', 'open-edit-save', 'unsaved-dot', 'evidence-panels', 'workbench-transfer']::text[], array[]::text[]),
    ('terminal-without-fear', array['prompt-model', 'navigation-mission', 'safe-commands', 'silent-success', 'terminal-transfer']::text[], array[]::text[]),
    ('values-variables-types', array['value-lab', 'compare-types', 'trace-memory', 'fix-type-mix', 'name-things', 'capstone-change']::text[], array[]::text[]),
    (
      'decisions-loops-functions',
      array['if-logic', 'loop-iteration', 'broken-loop', 'predict-path', 'function-output', 'pass-retry-mission']::text[],
      array['if-logic-simulator', 'if-logic-check', 'loop-iteration-simulator', 'loop-iteration-check', 'broken-loop-simulator', 'broken-loop-check']::text[]
    ),
    (
      'input-process-output-state',
      array['input-flow', 'state-journey', 'broken-update', 'trace-observe', 'predict-repeat', 'recap']::text[],
      array['state-journey-simulator', 'state-journey-check', 'trace-observe-simulator', 'trace-observe-check', 'predict-repeat-simulator', 'predict-repeat-check']::text[]
    ),
    ('languages-syntax-errors', array['language-jobs', 'safe-starter', 'repair-syntax', 'error-language', 'language-sorting', 'lesson-recap']::text[], array[]::text[]),
    ('interpreters-compilers-runtimes', array['journey-concept', 'python-route', 'javascript-route', 'compiled-route', 'broken-runtime', 'mission-route', 'journey-recap']::text[], array[]::text[]),
    (
      'packages-dependencies-environments',
      array['project-snapshot', 'install-react', 'compare-env', 'lock-mission', 'security-verification', 'package-mission', 'lesson-recap']::text[],
      array['security-verification-simulator', 'security-verification-check']::text[]
    ),
    (
      'frontend-backend-api-database-cloud',
      array['journey-concept', 'frontend-journey-success', 'backend-validation', 'secret-placement', 'journey-repair', 'journey-mission', 'lesson-recap']::text[],
      array['backend-validation-simulator', 'backend-validation-check', 'secret-placement-simulator', 'secret-placement-check']::text[]
    )
), manifest_ids as (
  select
    'foundations'::text as course_slug,
    2 as curriculum_version,
    manifest.lesson_slug,
    step_id as progress_id,
    'step'::text as id_kind
  from manifest
  cross join lateral unnest(manifest.step_ids) step_id

  union all

  select
    'foundations'::text as course_slug,
    2 as curriculum_version,
    manifest.lesson_slug,
    activity_id as progress_id,
    'activity'::text as id_kind
  from manifest
  cross join lateral unnest(manifest.activity_ids) activity_id
)
insert into private.curriculum_progress_ids (
  course_slug,
  curriculum_version,
  lesson_slug,
  progress_id,
  id_kind
)
select
  manifest_ids.course_slug,
  manifest_ids.curriculum_version,
  manifest_ids.lesson_slug,
  manifest_ids.progress_id,
  manifest_ids.id_kind
from manifest_ids
on conflict (
  course_slug,
  curriculum_version,
  lesson_slug,
  progress_id
) do update set id_kind = excluded.id_kind;

create table public.learner_course_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  course_slug text not null,
  curriculum_version integer not null check (curriculum_version > 0),
  course_epoch bigint not null default 0 check (course_epoch >= 0),
  revision bigint not null default 0 check (revision >= 0),
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_slug),
  check (course_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  check (jsonb_typeof(payload) = 'object'),
  check (octet_length(convert_to(payload::text, 'UTF8')) <= 1048576)
);

create index learner_course_progress_user_id_idx
  on public.learner_course_progress (user_id);

create table public.progress_sync_requests (
  user_id uuid not null references auth.users (id) on delete cascade,
  course_slug text not null,
  idempotency_key uuid not null,
  operation text not null check (operation in ('sync', 'reset-course', 'reset-lesson')),
  request_hash text not null check (request_hash ~ '^[a-f0-9]{64}$'),
  response_revision bigint not null check (response_revision >= 0),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  primary key (user_id, course_slug, idempotency_key),
  foreign key (user_id, course_slug)
    references public.learner_course_progress (user_id, course_slug)
    on delete cascade,
  check (expires_at is null or expires_at > created_at)
);

create index progress_sync_requests_created_at_idx
  on public.progress_sync_requests (created_at);

create index progress_sync_requests_expires_at_idx
  on public.progress_sync_requests (expires_at)
  where expires_at is not null;

comment on table public.progress_sync_requests is
  'Applied sync requests are idempotent for at least 30 days and are lazily deleted on a later mutation after expiry. Reset receipts do not expire, so delayed reset retries cannot reset newer work. Conflict responses are not receipts because they perform no mutation. Each user/course is capped at 10000 active receipts.';

comment on column public.progress_sync_requests.response_revision is
  'Revision produced by the original mutation. A duplicate RPC returns the latest canonical document so callers can safely converge without replaying the mutation.';

alter table public.profiles enable row level security;
alter table public.email_preferences enable row level security;
alter table public.email_preference_events enable row level security;
alter table public.curriculum_lessons enable row level security;
alter table public.learner_course_progress enable row level security;
alter table public.progress_sync_requests enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "email_preferences_select_own"
  on public.email_preferences for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "email_preference_events_select_own"
  on public.email_preference_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "curriculum_lessons_public_read"
  on public.curriculum_lessons for select
  to anon, authenticated
  using (true);

create policy "learner_course_progress_select_own"
  on public.learner_course_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Writes go through the functions below. They derive user_id from auth.uid(),
-- lock the row, and never accept an email or user ID from a request body.

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate_name text;
begin
  candidate_name := nullif(
    left(
      coalesce(
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name',
        ''
      ),
      120
    ),
    ''
  );

  insert into public.profiles (id, display_name)
  values (new.id, candidate_name)
  on conflict (id) do nothing;

  insert into public.email_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.empty_progress_lessons(
  p_course_slug text,
  p_curriculum_version integer
)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(
    jsonb_object_agg(
      lesson.lesson_slug,
      jsonb_build_object(
        'lessonEpoch', 0,
        'completedAt', null,
        'versions', jsonb_build_object(
          lesson.lesson_version::text,
          jsonb_build_object(
            'lessonVersion', lesson.lesson_version,
            'currentStep', null,
            'completedStepsAt', jsonb_build_object(),
            'completedActivitiesAt', jsonb_build_object(),
            'attempts', jsonb_build_object(),
            'hints', jsonb_build_object(),
            'savedCode', jsonb_build_object()
          )
        )
      )
      order by lesson.lesson_order
    ),
    jsonb_build_object()
  )
  from public.curriculum_lessons lesson
  where lesson.course_slug = p_course_slug
    and lesson.curriculum_version = p_curriculum_version;
$$;

create or replace function private.is_verified_non_anonymous_authenticated()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select auth.uid() is not null
    and coalesce(auth.jwt() ->> 'is_anonymous', 'false') = 'false'
    and exists (
      select 1
      from auth.users auth_user
      where auth_user.id = auth.uid()
        and auth_user.email_confirmed_at is not null
    );
$$;

create or replace function private.is_valid_progress_timestamp(p_value text)
returns boolean
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if p_value is null
    or char_length(p_value) < 20
    or char_length(p_value) > 40
    or p_value !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,9})?(Z|[+-][0-9]{2}:[0-9]{2})$'
  then
    return false;
  end if;

  if p_value::timestamptz > now() + interval '24 hours' then
    return false;
  end if;

  return true;
exception
  when others then
    return false;
end;
$$;

create or replace function private.is_bounded_json_integer(
  p_value jsonb,
  p_maximum numeric
)
returns boolean
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  numeric_text text;
begin
  if jsonb_typeof(p_value) is distinct from 'number' then
    return false;
  end if;

  numeric_text := p_value::text;
  if numeric_text !~ '^[0-9]{1,10}(\.0+)?$' then
    return false;
  end if;

  return numeric_text::numeric <= p_maximum;
exception
  when others then
    return false;
end;
$$;

create or replace function private.utf16_code_units(p_value text)
returns integer
language sql
immutable
security invoker
set search_path = ''
as $$
  select coalesce(
    sum(
      case
        when ascii(substr(p_value, character_position, 1)) > 65535 then 2
        else 1
      end
    ),
    0
  )::integer
  from generate_series(1, char_length(p_value)) character_position;
$$;

create or replace function private.is_valid_progress_lesson(
  p_course_slug text,
  p_curriculum_version integer,
  p_lesson_slug text,
  p_lesson_version integer,
  p_lesson jsonb
)
returns boolean
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  version_state jsonb;
  map_entry record;
  component_entry record;
  numeric_text text;
  saved_code text;
begin
  if jsonb_typeof(p_lesson) is distinct from 'object'
    or octet_length(convert_to(p_lesson::text, 'UTF8')) > 262144
    or (select count(*) from jsonb_object_keys(p_lesson)) <> 3
    or exists (
      select 1
      from jsonb_object_keys(p_lesson) key_name
      where key_name not in ('lessonEpoch', 'completedAt', 'versions')
    )
  then
    return false;
  end if;

  if not private.is_bounded_json_integer(
    p_lesson -> 'lessonEpoch',
    1000000000
  ) then
    return false;
  end if;

  if p_lesson -> 'completedAt' <> 'null'::jsonb and (
    jsonb_typeof(p_lesson -> 'completedAt') is distinct from 'string'
    or not private.is_valid_progress_timestamp(p_lesson ->> 'completedAt')
  ) then
    return false;
  end if;

  if jsonb_typeof(p_lesson -> 'versions') is distinct from 'object'
    or (select count(*) from jsonb_object_keys(p_lesson -> 'versions')) <> 1
    or jsonb_typeof(
      p_lesson #> array['versions', p_lesson_version::text]
    ) is distinct from 'object'
  then
    return false;
  end if;

  version_state := p_lesson #> array['versions', p_lesson_version::text];

  if (select count(*) from jsonb_object_keys(version_state)) <> 7
    or exists (
      select 1
      from jsonb_object_keys(version_state) key_name
      where key_name not in (
        'lessonVersion',
        'currentStep',
        'completedStepsAt',
        'completedActivitiesAt',
        'attempts',
        'hints',
        'savedCode'
      )
    )
  then
    return false;
  end if;

  if not private.is_bounded_json_integer(
    version_state -> 'lessonVersion',
    1000000000
  ) then
    return false;
  end if;
  numeric_text := version_state ->> 'lessonVersion';
  if numeric_text::numeric <> p_lesson_version then
    return false;
  end if;

  if version_state -> 'currentStep' <> 'null'::jsonb then
    if jsonb_typeof(version_state -> 'currentStep') is distinct from 'object'
      or (select count(*) from jsonb_object_keys(version_state -> 'currentStep')) <> 2
      or exists (
        select 1
        from jsonb_object_keys(version_state -> 'currentStep') key_name
        where key_name not in ('value', 'updatedAt')
      )
      or jsonb_typeof(version_state #> '{currentStep,value}') is distinct from 'string'
      or jsonb_typeof(version_state #> '{currentStep,updatedAt}') is distinct from 'string'
      or not private.is_valid_progress_timestamp(
        version_state #>> '{currentStep,updatedAt}'
      )
      or not exists (
        select 1
        from private.curriculum_progress_ids progress_id
        where progress_id.course_slug = p_course_slug
          and progress_id.curriculum_version = p_curriculum_version
          and progress_id.lesson_slug = p_lesson_slug
          and progress_id.id_kind = 'step'
          and progress_id.progress_id = version_state #>> '{currentStep,value}'
      )
    then
      return false;
    end if;
  end if;

  if jsonb_typeof(version_state -> 'completedStepsAt') is distinct from 'object' then
    return false;
  end if;
  for map_entry in select * from jsonb_each(version_state -> 'completedStepsAt')
  loop
    if jsonb_typeof(map_entry.value) is distinct from 'string'
      or not private.is_valid_progress_timestamp(map_entry.value #>> '{}')
      or not exists (
        select 1
        from private.curriculum_progress_ids progress_id
        where progress_id.course_slug = p_course_slug
          and progress_id.curriculum_version = p_curriculum_version
          and progress_id.lesson_slug = p_lesson_slug
          and progress_id.id_kind = 'step'
          and progress_id.progress_id = map_entry.key
      )
    then
      return false;
    end if;
  end loop;

  if jsonb_typeof(version_state -> 'completedActivitiesAt') is distinct from 'object' then
    return false;
  end if;
  for map_entry in select * from jsonb_each(version_state -> 'completedActivitiesAt')
  loop
    if jsonb_typeof(map_entry.value) is distinct from 'string'
      or not private.is_valid_progress_timestamp(map_entry.value #>> '{}')
      or not exists (
        select 1
        from private.curriculum_progress_ids progress_id
        where progress_id.course_slug = p_course_slug
          and progress_id.curriculum_version = p_curriculum_version
          and progress_id.lesson_slug = p_lesson_slug
          and progress_id.progress_id = map_entry.key
      )
    then
      return false;
    end if;
  end loop;

  foreach numeric_text in array array['attempts', 'hints']
  loop
    if jsonb_typeof(version_state -> numeric_text) is distinct from 'object' then
      return false;
    end if;

    for map_entry in select * from jsonb_each(version_state -> numeric_text)
    loop
      if jsonb_typeof(map_entry.value) is distinct from 'object'
        or (select count(*) from jsonb_object_keys(map_entry.value)) > 32
        or not exists (
          select 1
          from private.curriculum_progress_ids progress_id
          where progress_id.course_slug = p_course_slug
            and progress_id.curriculum_version = p_curriculum_version
            and progress_id.lesson_slug = p_lesson_slug
            and progress_id.progress_id = map_entry.key
        )
      then
        return false;
      end if;

      for component_entry in select * from jsonb_each(map_entry.value)
      loop
        if component_entry.key !~ '^[A-Za-z0-9._:-]{1,128}$'
          or jsonb_typeof(component_entry.value) is distinct from 'number'
        then
          return false;
        end if;

        if not private.is_bounded_json_integer(
          component_entry.value,
          1000000
        ) then
          return false;
        end if;
      end loop;
    end loop;
  end loop;

  if jsonb_typeof(version_state -> 'savedCode') is distinct from 'object' then
    return false;
  end if;
  for map_entry in select * from jsonb_each(version_state -> 'savedCode')
  loop
    if jsonb_typeof(map_entry.value) is distinct from 'object'
      or (select count(*) from jsonb_object_keys(map_entry.value)) <> 2
      or exists (
        select 1
        from jsonb_object_keys(map_entry.value) key_name
        where key_name not in ('value', 'updatedAt')
      )
      or not exists (
        select 1
        from private.curriculum_progress_ids progress_id
        where progress_id.course_slug = p_course_slug
          and progress_id.curriculum_version = p_curriculum_version
          and progress_id.lesson_slug = p_lesson_slug
          and progress_id.progress_id = map_entry.key
      )
      or jsonb_typeof(map_entry.value -> 'updatedAt') is distinct from 'string'
      or not private.is_valid_progress_timestamp(map_entry.value ->> 'updatedAt')
    then
      return false;
    end if;

    if map_entry.value -> 'value' <> 'null'::jsonb then
      if jsonb_typeof(map_entry.value -> 'value') is distinct from 'string' then
        return false;
      end if;

      saved_code := map_entry.value ->> 'value';
      if private.utf16_code_units(saved_code) > 10000
        or octet_length(convert_to(saved_code, 'UTF8')) > 40000
      then
        return false;
      end if;
    end if;
  end loop;

  return true;
exception
  when others then
    return false;
end;
$$;

create or replace function private.set_email_marketing_preference(p_enabled boolean)
returns public.email_preferences
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  result public.email_preferences;
  previous_enabled boolean;
  policy_version constant text := 'marketing-v1-2026-08-12';
begin
  if not private.is_verified_non_anonymous_authenticated() then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_enabled is null then
    raise exception 'A marketing preference is required' using errcode = '22023';
  end if;

  select preference.marketing_enabled
  into previous_enabled
  from public.email_preferences preference
  where preference.user_id = current_user_id
  for update;

  insert into public.email_preferences (
    user_id,
    marketing_enabled,
    consented_at,
    revoked_at,
    updated_at
  )
  values (
    current_user_id,
    p_enabled,
    case when p_enabled then now() else null end,
    case when p_enabled then null else now() end,
    now()
  )
  on conflict (user_id) do update
  set
    marketing_enabled = excluded.marketing_enabled,
    consented_at = case
      when excluded.marketing_enabled
        and not public.email_preferences.marketing_enabled then now()
      else public.email_preferences.consented_at
    end,
    revoked_at = case
      when excluded.marketing_enabled then null
      when public.email_preferences.marketing_enabled then now()
      else public.email_preferences.revoked_at
    end,
    updated_at = now()
  returning * into result;

  if previous_enabled is distinct from p_enabled then
    insert into public.email_preference_events (
      user_id,
      marketing_enabled,
      policy_version
    )
    values (current_user_id, p_enabled, policy_version);
  end if;

  return result;
end;
$$;

create or replace function private.commit_progress_document(
  p_course_slug text,
  p_curriculum_version integer,
  p_expected_revision bigint,
  p_expected_course_epoch bigint,
  p_idempotency_key uuid,
  p_payload jsonb
)
returns table (
  sync_status text,
  revision bigint,
  course_epoch bigint,
  payload jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_document public.learner_course_progress%rowtype;
  existing_hash text;
  request_hash text;
  next_payload jsonb;
  next_revision bigint;
  filtered_lessons jsonb;
begin
  if not private.is_verified_non_anonymous_authenticated() then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_course_slug is null
    or p_curriculum_version is null
    or p_expected_revision is null
    or p_expected_course_epoch is null
    or p_idempotency_key is null
    or p_expected_revision < 0
    or p_expected_revision > 1000000000
    or p_expected_course_epoch < 0
    or p_expected_course_epoch > 1000000000
  then
    raise exception 'Invalid progress revision' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.curriculum_lessons lesson
    where lesson.course_slug = p_course_slug
      and lesson.curriculum_version = p_curriculum_version
  ) then
    raise exception 'Unknown course or curriculum version' using errcode = '22023';
  end if;

  if p_payload is null
    or jsonb_typeof(p_payload) is distinct from 'object'
    or octet_length(convert_to(p_payload::text, 'UTF8')) > 1000000
  then
    raise exception 'Invalid or oversized progress document' using errcode = '22023';
  end if;

  if (select count(*) from jsonb_object_keys(p_payload)) <> 9
    or exists (
      select 1
      from jsonb_object_keys(p_payload) key_name
      where key_name not in (
        'schemaVersion',
        'courseSlug',
        'curriculumVersion',
        'courseEpoch',
        'revision',
        'legacyLevel1Access',
        'lastVisited',
        'lessons',
        'updatedAt'
      )
    )
    or jsonb_typeof(p_payload -> 'schemaVersion') is distinct from 'number'
    or p_payload ->> 'schemaVersion' is distinct from '2'
    or jsonb_typeof(p_payload -> 'courseSlug') is distinct from 'string'
    or p_payload ->> 'courseSlug' is distinct from p_course_slug
    or jsonb_typeof(p_payload -> 'curriculumVersion') is distinct from 'number'
    or p_payload ->> 'curriculumVersion' is distinct from p_curriculum_version::text
    or not private.is_bounded_json_integer(
      p_payload -> 'courseEpoch',
      1000000000
    )
    or not private.is_bounded_json_integer(
      p_payload -> 'revision',
      1000000000
    )
    or jsonb_typeof(p_payload -> 'legacyLevel1Access') is distinct from 'boolean'
    or jsonb_typeof(p_payload -> 'lessons') is distinct from 'object'
    or jsonb_typeof(p_payload -> 'updatedAt') is distinct from 'string'
    or not private.is_valid_progress_timestamp(p_payload ->> 'updatedAt')
  then
    raise exception 'Invalid or oversized progress document' using errcode = '22023';
  end if;

  if (
    select count(*)
    from jsonb_object_keys(p_payload -> 'lessons') supplied(lesson_slug)
  ) <> (
    select count(*)
    from public.curriculum_lessons lesson
    where lesson.course_slug = p_course_slug
      and lesson.curriculum_version = p_curriculum_version
  ) or exists (
    select 1
    from jsonb_object_keys(p_payload -> 'lessons') supplied(lesson_slug)
    where not exists (
      select 1
      from public.curriculum_lessons lesson
      where lesson.course_slug = p_course_slug
        and lesson.curriculum_version = p_curriculum_version
        and lesson.lesson_slug = supplied.lesson_slug
    )
  ) then
    raise exception 'Progress document has unknown or missing lessons' using errcode = '22023';
  end if;

  if p_payload -> 'lastVisited' <> 'null'::jsonb then
    if jsonb_typeof(p_payload -> 'lastVisited') is distinct from 'object' then
      raise exception 'Progress document has an invalid last-visited lesson' using errcode = '22023';
    end if;

    if (select count(*) from jsonb_object_keys(p_payload -> 'lastVisited')) <> 2
      or exists (
        select 1
        from jsonb_object_keys(p_payload -> 'lastVisited') key_name
        where key_name not in ('value', 'updatedAt')
      )
      or jsonb_typeof(p_payload #> '{lastVisited,value}') is distinct from 'string'
      or jsonb_typeof(p_payload #> '{lastVisited,updatedAt}') is distinct from 'string'
      or not private.is_valid_progress_timestamp(
        p_payload #>> '{lastVisited,updatedAt}'
      )
      or not exists (
        select 1
        from public.curriculum_lessons lesson
        where lesson.course_slug = p_course_slug
          and lesson.curriculum_version = p_curriculum_version
          and lesson.lesson_slug = p_payload #>> '{lastVisited,value}'
      )
    then
      raise exception 'Progress document has an invalid last-visited lesson' using errcode = '22023';
    end if;
  end if;

  request_hash := encode(
    extensions.digest(
      concat_ws(
        ':',
        'sync',
        p_course_slug,
        p_curriculum_version,
        p_expected_revision,
        p_expected_course_epoch,
        p_payload::text
      ),
      'sha256'
    ),
    'hex'
  );

  -- Sync receipts have a bounded retention window. Deleting one cannot replay
  -- an old sync because its expected revision/epoch will conflict after the
  -- original mutation. Reset receipts never expire because reset has no CAS
  -- arguments and a delayed retry must never clear newer progress.
  delete from public.progress_sync_requests request
  where request.user_id = current_user_id
    and request.course_slug = p_course_slug
    and request.expires_at is not null
    and request.expires_at <= now();

  select request.request_hash
  into existing_hash
  from public.progress_sync_requests request
  where request.user_id = current_user_id
    and request.course_slug = p_course_slug
    and request.idempotency_key = p_idempotency_key;

  if found then
    if existing_hash <> request_hash then
      raise exception 'Idempotency key was reused for another request' using errcode = '22023';
    end if;

    return query
      select 'duplicate', document.revision, document.course_epoch, document.payload
      from public.learner_course_progress document
      where document.user_id = current_user_id
        and document.course_slug = p_course_slug;
    return;
  end if;

  insert into public.learner_course_progress (
    user_id,
    course_slug,
    curriculum_version,
    course_epoch,
    revision,
    payload
  )
  values (
    current_user_id,
    p_course_slug,
    p_curriculum_version,
    0,
    0,
    jsonb_build_object(
      'schemaVersion', 2,
      'courseSlug', p_course_slug,
      'curriculumVersion', p_curriculum_version,
      'courseEpoch', 0,
      'revision', 0,
      'legacyLevel1Access', false,
      'lastVisited', null,
      'lessons', private.empty_progress_lessons(p_course_slug, p_curriculum_version),
      'updatedAt', now()
    )
  )
  on conflict (user_id, course_slug) do nothing;

  select *
  into current_document
  from public.learner_course_progress document
  where document.user_id = current_user_id
    and document.course_slug = p_course_slug
  for update;

  if current_document.curriculum_version <> p_curriculum_version then
    raise exception 'Curriculum migration required' using errcode = '22023';
  end if;

  -- The row lock closes the race between the first receipt lookup and commit.
  select request.request_hash
  into existing_hash
  from public.progress_sync_requests request
  where request.user_id = current_user_id
    and request.course_slug = p_course_slug
    and request.idempotency_key = p_idempotency_key;

  if found then
    if existing_hash <> request_hash then
      raise exception 'Idempotency key was reused for another request' using errcode = '22023';
    end if;

    return query
      select 'duplicate', current_document.revision, current_document.course_epoch, current_document.payload;
    return;
  end if;

  if (
    select count(*)
    from public.progress_sync_requests request
    where request.user_id = current_user_id
      and request.course_slug = p_course_slug
  ) >= 10000 then
    raise exception 'Too many active progress receipts' using errcode = '54000';
  end if;

  if current_document.revision <> p_expected_revision
    or current_document.course_epoch <> p_expected_course_epoch
  then
    return query
      select 'conflict', current_document.revision, current_document.course_epoch, current_document.payload;
    return;
  end if;

  if current_document.revision >= 1000000000 then
    raise exception 'Progress revision limit reached' using errcode = '22023';
  end if;

  if p_payload ->> 'courseEpoch' is distinct from current_document.course_epoch::text
    or p_payload ->> 'revision' is distinct from p_expected_revision::text
  then
    raise exception 'Progress document has stale concurrency values' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.curriculum_lessons lesson
    where lesson.course_slug = p_course_slug
      and lesson.curriculum_version = p_curriculum_version
      and (
        not private.is_valid_progress_lesson(
          p_course_slug,
          p_curriculum_version,
          lesson.lesson_slug,
          lesson.lesson_version,
          p_payload #> array['lessons', lesson.lesson_slug]
        )
        or p_payload #>> array['lessons', lesson.lesson_slug, 'lessonEpoch'] is distinct from coalesce(
          current_document.payload #>> array['lessons', lesson.lesson_slug, 'lessonEpoch'],
          '0'
        )
      )
  ) then
    raise exception 'Progress document has invalid lesson state or a stale lesson epoch' using errcode = '22023';
  end if;

  select coalesce(jsonb_object_agg(entry.key, entry.value), jsonb_build_object())
  into filtered_lessons
  from jsonb_each(p_payload -> 'lessons') entry
  where exists (
    select 1
    from public.curriculum_lessons lesson
    where lesson.course_slug = p_course_slug
      and lesson.curriculum_version = p_curriculum_version
      and lesson.lesson_slug = entry.key
  );

  next_revision := current_document.revision + 1;
  next_payload := jsonb_build_object(
    'schemaVersion', 2,
    'courseSlug', p_course_slug,
    'curriculumVersion', p_curriculum_version,
    'courseEpoch', current_document.course_epoch,
    'revision', next_revision,
    'legacyLevel1Access', (p_payload ->> 'legacyLevel1Access')::boolean,
    'lastVisited', coalesce(p_payload -> 'lastVisited', 'null'::jsonb),
    'lessons', filtered_lessons,
    'updatedAt', now()
  );

  update public.learner_course_progress
  set
    curriculum_version = p_curriculum_version,
    revision = next_revision,
    payload = next_payload,
    updated_at = now()
  where user_id = current_user_id
    and course_slug = p_course_slug;

  insert into public.progress_sync_requests (
    user_id,
    course_slug,
    idempotency_key,
    operation,
    request_hash,
    response_revision,
    expires_at
  )
  values (
    current_user_id,
    p_course_slug,
    p_idempotency_key,
    'sync',
    request_hash,
    next_revision,
    now() + interval '30 days'
  );

  return query
    select 'applied', next_revision, current_document.course_epoch, next_payload;
end;
$$;

create or replace function private.reset_progress_document(
  p_course_slug text,
  p_curriculum_version integer,
  p_scope text,
  p_lesson_slug text,
  p_idempotency_key uuid
)
returns table (
  sync_status text,
  revision bigint,
  course_epoch bigint,
  payload jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_document public.learner_course_progress%rowtype;
  existing_hash text;
  request_hash text;
  next_payload jsonb;
  next_revision bigint;
  next_course_epoch bigint;
  next_lesson_epoch bigint;
  current_lesson_version integer;
  current_lesson_epoch jsonb;
  operation_name text;
begin
  if not private.is_verified_non_anonymous_authenticated() then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_course_slug is null
    or p_curriculum_version is null
    or p_scope is null
    or p_idempotency_key is null
  then
    raise exception 'Invalid reset request' using errcode = '22023';
  end if;

  if p_scope not in ('course', 'lesson') then
    raise exception 'Invalid reset scope' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.curriculum_lessons lesson
    where lesson.course_slug = p_course_slug
      and lesson.curriculum_version = p_curriculum_version
  ) then
    raise exception 'Unknown course or curriculum version' using errcode = '22023';
  end if;

  if (p_scope = 'course' and p_lesson_slug is not null)
    or (p_scope = 'lesson' and p_lesson_slug is null)
  then
    raise exception 'Invalid lesson reset target' using errcode = '22023';
  end if;

  if p_scope = 'lesson' and not exists (
    select 1
    from public.curriculum_lessons lesson
    where lesson.course_slug = p_course_slug
      and lesson.curriculum_version = p_curriculum_version
      and lesson.lesson_slug = p_lesson_slug
  ) then
    raise exception 'Unknown lesson' using errcode = '22023';
  end if;

  if p_scope = 'lesson' then
    select lesson.lesson_version
    into current_lesson_version
    from public.curriculum_lessons lesson
    where lesson.course_slug = p_course_slug
      and lesson.curriculum_version = p_curriculum_version
      and lesson.lesson_slug = p_lesson_slug;
  end if;

  operation_name := case when p_scope = 'course' then 'reset-course' else 'reset-lesson' end;
  request_hash := encode(
    extensions.digest(
      concat_ws(':', operation_name, p_course_slug, p_curriculum_version, coalesce(p_lesson_slug, '')),
      'sha256'
    ),
    'hex'
  );

  delete from public.progress_sync_requests request
  where request.user_id = current_user_id
    and request.course_slug = p_course_slug
    and request.expires_at is not null
    and request.expires_at <= now();

  insert into public.learner_course_progress (
    user_id,
    course_slug,
    curriculum_version,
    course_epoch,
    revision,
    payload
  )
  values (
    current_user_id,
    p_course_slug,
    p_curriculum_version,
    0,
    0,
    jsonb_build_object(
      'schemaVersion', 2,
      'courseSlug', p_course_slug,
      'curriculumVersion', p_curriculum_version,
      'courseEpoch', 0,
      'revision', 0,
      'legacyLevel1Access', false,
      'lastVisited', null,
      'lessons', private.empty_progress_lessons(p_course_slug, p_curriculum_version),
      'updatedAt', now()
    )
  )
  on conflict (user_id, course_slug) do nothing;

  select *
  into current_document
  from public.learner_course_progress document
  where document.user_id = current_user_id
    and document.course_slug = p_course_slug
  for update;

  if current_document.curriculum_version <> p_curriculum_version then
    raise exception 'Curriculum migration required' using errcode = '22023';
  end if;

  select request.request_hash
  into existing_hash
  from public.progress_sync_requests request
  where request.user_id = current_user_id
    and request.course_slug = p_course_slug
    and request.idempotency_key = p_idempotency_key;

  if found then
    if existing_hash <> request_hash then
      raise exception 'Idempotency key was reused for another request' using errcode = '22023';
    end if;

    return query
      select 'duplicate', current_document.revision, current_document.course_epoch, current_document.payload;
    return;
  end if;

  if (
    select count(*)
    from public.progress_sync_requests request
    where request.user_id = current_user_id
      and request.course_slug = p_course_slug
  ) >= 10000 then
    raise exception 'Too many active progress receipts' using errcode = '54000';
  end if;

  if current_document.revision >= 1000000000 then
    raise exception 'Progress revision limit reached' using errcode = '22023';
  end if;

  next_revision := current_document.revision + 1;
  next_course_epoch := current_document.course_epoch;

  if p_scope = 'course' then
    if current_document.course_epoch >= 1000000000 then
      raise exception 'Progress epoch limit reached' using errcode = '22023';
    end if;

    next_course_epoch := current_document.course_epoch + 1;
    next_payload := jsonb_build_object(
      'schemaVersion', 2,
      'courseSlug', p_course_slug,
      'curriculumVersion', p_curriculum_version,
      'courseEpoch', next_course_epoch,
      'revision', next_revision,
      'legacyLevel1Access', false,
      'lastVisited', null,
      'lessons', private.empty_progress_lessons(p_course_slug, p_curriculum_version),
      'updatedAt', now()
    );
  else
    current_lesson_epoch := current_document.payload #> array['lessons', p_lesson_slug, 'lessonEpoch'];
    if not private.is_bounded_json_integer(
      current_lesson_epoch,
      999999999
    ) then
      raise exception 'Invalid or exhausted lesson epoch' using errcode = '22023';
    end if;
    next_lesson_epoch := current_lesson_epoch::text::numeric::bigint + 1;

    next_payload := jsonb_set(
      current_document.payload,
      array['lessons', p_lesson_slug],
      jsonb_build_object(
        'lessonEpoch', next_lesson_epoch,
        'completedAt', null,
        'versions', jsonb_build_object(
          current_lesson_version::text,
          jsonb_build_object(
            'lessonVersion', current_lesson_version,
            'currentStep', null,
            'completedStepsAt', jsonb_build_object(),
            'completedActivitiesAt', jsonb_build_object(),
            'attempts', jsonb_build_object(),
            'hints', jsonb_build_object(),
            'savedCode', jsonb_build_object()
          )
        )
      ),
      true
    );
    next_payload := jsonb_set(next_payload, '{revision}', to_jsonb(next_revision), true);
    next_payload := jsonb_set(next_payload, '{courseEpoch}', to_jsonb(next_course_epoch), true);
    next_payload := jsonb_set(next_payload, '{updatedAt}', to_jsonb(now()), true);
  end if;

  update public.learner_course_progress
  set
    curriculum_version = p_curriculum_version,
    course_epoch = next_course_epoch,
    revision = next_revision,
    payload = next_payload,
    updated_at = now()
  where user_id = current_user_id
    and course_slug = p_course_slug;

  insert into public.progress_sync_requests (
    user_id,
    course_slug,
    idempotency_key,
    operation,
    request_hash,
    response_revision
  )
  values (
    current_user_id,
    p_course_slug,
    p_idempotency_key,
    operation_name,
    request_hash,
    next_revision
  );

  return query
    select 'applied', next_revision, next_course_epoch, next_payload;
end;
$$;

create or replace function public.set_email_marketing_preference(p_enabled boolean)
returns public.email_preferences
language sql
security invoker
set search_path = ''
as $$
  select private.set_email_marketing_preference(p_enabled);
$$;

create or replace function public.commit_progress_document(
  p_course_slug text,
  p_curriculum_version integer,
  p_expected_revision bigint,
  p_expected_course_epoch bigint,
  p_idempotency_key uuid,
  p_payload jsonb
)
returns table (
  sync_status text,
  revision bigint,
  course_epoch bigint,
  payload jsonb
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.commit_progress_document(
    p_course_slug,
    p_curriculum_version,
    p_expected_revision,
    p_expected_course_epoch,
    p_idempotency_key,
    p_payload
  );
$$;

create or replace function public.reset_progress_document(
  p_course_slug text,
  p_curriculum_version integer,
  p_scope text,
  p_lesson_slug text,
  p_idempotency_key uuid
)
returns table (
  sync_status text,
  revision bigint,
  course_epoch bigint,
  payload jsonb
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.reset_progress_document(
    p_course_slug,
    p_curriculum_version,
    p_scope,
    p_lesson_slug,
    p_idempotency_key
  );
$$;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

revoke all on public.email_preferences from anon, authenticated;
grant select on public.email_preferences to authenticated;

revoke all on public.email_preference_events from anon, authenticated;
grant select on public.email_preference_events to authenticated;
revoke all privileges on sequence public.email_preference_events_id_seq
  from public, anon, authenticated, service_role;

revoke all on public.curriculum_lessons from anon, authenticated;
grant select on public.curriculum_lessons to anon, authenticated;

revoke all on public.learner_course_progress from anon, authenticated;
grant select on public.learner_course_progress to authenticated;

revoke all on public.progress_sync_requests from anon, authenticated;

revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.empty_progress_lessons(text, integer) from public, anon, authenticated;
revoke all on function private.is_verified_non_anonymous_authenticated() from public, anon, authenticated;
revoke all on function private.is_valid_progress_timestamp(text) from public, anon, authenticated;
revoke all on function private.is_bounded_json_integer(jsonb, numeric) from public, anon, authenticated;
revoke all on function private.utf16_code_units(text) from public, anon, authenticated;
revoke all on function private.is_valid_progress_lesson(text, integer, text, integer, jsonb) from public, anon, authenticated;
revoke all on function private.set_email_marketing_preference(boolean) from public, anon;
revoke all on function private.commit_progress_document(text, integer, bigint, bigint, uuid, jsonb) from public, anon;
revoke all on function private.reset_progress_document(text, integer, text, text, uuid) from public, anon;

revoke all on private.curriculum_progress_ids from public, anon, authenticated;

grant usage on schema private to authenticated;
grant execute on function private.set_email_marketing_preference(boolean) to authenticated;
grant execute on function private.commit_progress_document(text, integer, bigint, bigint, uuid, jsonb) to authenticated;
grant execute on function private.reset_progress_document(text, integer, text, text, uuid) to authenticated;

revoke all on function public.set_email_marketing_preference(boolean) from public, anon;
grant execute on function public.set_email_marketing_preference(boolean) to authenticated;

revoke all on function public.commit_progress_document(text, integer, bigint, bigint, uuid, jsonb) from public, anon;
grant execute on function public.commit_progress_document(text, integer, bigint, bigint, uuid, jsonb) to authenticated;

revoke all on function public.reset_progress_document(text, integer, text, text, uuid) from public, anon;
grant execute on function public.reset_progress_document(text, integer, text, text, uuid) to authenticated;
