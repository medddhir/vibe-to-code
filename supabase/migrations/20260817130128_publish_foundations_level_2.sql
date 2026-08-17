-- Publish the complete Developer Foundations path as curriculum version 4.
-- Versions 2 and 3 remain immutable for rollback and trusted normalization.
lock table public.curriculum_lessons in share row exclusive mode;
lock table public.progress_sync_requests in share row exclusive mode;
lock table public.learner_course_progress in share row exclusive mode;

do $$
begin
  if exists (select 1 from public.learner_course_progress)
    or exists (select 1 from public.progress_sync_requests)
  then
    raise exception
      'Foundations curriculum v4 requires reviewed learner-progress migration'
      using errcode = '55000';
  end if;
end
$$;

insert into public.curriculum_lessons
  (course_slug, curriculum_version, lesson_slug, lesson_order, lesson_version)
values
  ('foundations', 4, 'what-is-code', 1, 3),
  ('foundations', 4, 'source-code-running-output', 2, 1),
  ('foundations', 4, 'hardware-operating-systems-apps', 3, 1),
  ('foundations', 4, 'files-folders-extensions', 4, 1),
  ('foundations', 4, 'paths-current-folder', 5, 1),
  ('foundations', 4, 'vscode-without-getting-lost', 6, 1),
  ('foundations', 4, 'terminal-without-fear', 7, 1),
  ('foundations', 4, 'values-variables-types', 8, 1),
  ('foundations', 4, 'decisions-loops-functions', 9, 1),
  ('foundations', 4, 'input-process-output-state', 10, 1),
  ('foundations', 4, 'languages-syntax-errors', 11, 1),
  ('foundations', 4, 'interpreters-compilers-runtimes', 12, 1),
  ('foundations', 4, 'packages-dependencies-environments', 13, 1),
  ('foundations', 4, 'frontend-backend-api-database-cloud', 14, 1),
  ('foundations', 4, 'internet-web-browser-server', 15, 1),
  ('foundations', 4, 'urls-domains-dns-paths-queries', 16, 1),
  ('foundations', 4, 'requests-responses-http-https', 17, 1),
  ('foundations', 4, 'browser-developer-tools', 18, 1),
  ('foundations', 4, 'first-html-document', 19, 1),
  ('foundations', 4, 'meaningful-html-text-links-images-controls', 20, 1),
  ('foundations', 4, 'css-selectors-colour-spacing-cascade', 21, 1),
  ('foundations', 4, 'box-model-layout-responsive-design', 22, 1),
  ('foundations', 4, 'javascript-dom-events', 23, 1);

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
    ),
    (
      'internet-web-browser-server',
      array['separate-internet-and-web', 'name-browser-search-and-server', 'trace-page-journey', 'rebuild-page-journey', 'diagnose-connection-layer', 'explain-complete-model']::text[],
      array['classify-web-roles', 'order-page-journey', 'identify-missing-layer']::text[]
    ),
    (
      'urls-domains-dns-paths-queries',
      array['read-complete-url', 'separate-host-and-dns', 'follow-path', 'decode-query-fragment', 'label-url-parts', 'recap-url-model']::text[],
      array['order-name-resolution', 'identify-url-parts', 'choose-url-change']::text[]
    ),
    (
      'requests-responses-http-https',
      array['name-client-server-message', 'distinguish-get-post', 'read-status-families', 'compare-http-https', 'diagnose-response-evidence', 'recap-http-journey']::text[],
      array['order-request-response', 'classify-request-method', 'interpret-status-family']::text[]
    ),
    (
      'browser-developer-tools',
      array['open-devtools-safely', 'inspect-elements', 'read-console-evidence', 'inspect-network-evidence', 'choose-debugging-panel', 'recap-evidence-workflow']::text[],
      array['interpret-devtools-change', 'match-panel-evidence', 'order-debugging-evidence']::text[]
    ),
    (
      'first-html-document',
      array['start-doctype-root', 'separate-head-body', 'set-document-title', 'add-heading-paragraph', 'assemble-html-document', 'recap-valid-document']::text[],
      array['identify-head-body', 'order-html-structure', 'diagnose-html-document']::text[]
    ),
    (
      'meaningful-html-text-links-images-controls',
      array['choose-semantic-text', 'make-real-link', 'describe-image', 'choose-button-or-link', 'label-form-control', 'recap-semantic-page']::text[],
      array['choose-semantic-element', 'match-control-purpose', 'order-labeled-control']::text[]
    ),
    (
      'css-selectors-colour-spacing-cascade',
      array['read-css-rule', 'target-with-selectors', 'set-colour-spacing', 'reuse-class-rules', 'resolve-cascade', 'recap-predictable-styles']::text[],
      array['identify-rule-parts', 'choose-selector', 'resolve-style-conflict']::text[]
    ),
    (
      'box-model-layout-responsive-design',
      array['see-four-box-layers', 'keep-normal-flow', 'choose-flex-or-grid', 'constrain-width', 'add-responsive-breakpoint', 'recap-adaptive-layout']::text[],
      array['order-box-layers', 'choose-layout-tool', 'predict-responsive-change']::text[]
    ),
    (
      'javascript-dom-events',
      array['meet-dom', 'select-element', 'listen-for-click', 'update-state', 'render-visible-result', 'recap-click-to-screen']::text[],
      array['choose-dom-operation', 'simulate-counter-clicks', 'order-dom-interaction']::text[]
    )
), manifest_ids as (
  select
    'foundations'::text as course_slug,
    4 as curriculum_version,
    manifest.lesson_slug,
    step_id as progress_id,
    'step'::text as id_kind
  from manifest
  cross join lateral unnest(manifest.step_ids) step_id

  union all

  select
    'foundations'::text as course_slug,
    4 as curriculum_version,
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
from manifest_ids;

-- Reinstall the existing private mutation functions in-place so their grants
-- remain unchanged while v4 becomes the only writable curriculum contract.
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
  current_curriculum_version integer;
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

  select max(lesson.curriculum_version)
  into current_curriculum_version
  from public.curriculum_lessons lesson
  where lesson.course_slug = p_course_slug;

  if current_curriculum_version is null then
    raise exception 'Unknown course or curriculum version' using errcode = '22023';
  end if;

  if p_curriculum_version <> current_curriculum_version then
    raise exception 'Curriculum migration required' using errcode = '22023';
  end if;

  if p_payload is null
    or jsonb_typeof(p_payload) is distinct from 'object'
    or octet_length(convert_to(p_payload::text, 'UTF8')) > 1048576
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
  current_curriculum_version integer;
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

  select max(lesson.curriculum_version)
  into current_curriculum_version
  from public.curriculum_lessons lesson
  where lesson.course_slug = p_course_slug;

  if current_curriculum_version is null then
    raise exception 'Unknown course or curriculum version' using errcode = '22023';
  end if;

  if p_curriculum_version <> current_curriculum_version then
    raise exception 'Curriculum migration required' using errcode = '22023';
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
