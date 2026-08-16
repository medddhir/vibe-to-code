-- Curriculum version 2 remains immutable for rollback. Version 3 adds only
-- Developer Foundations Level 2 Lesson 1 and its approved progress IDs.
insert into public.curriculum_lessons
  (course_slug, curriculum_version, lesson_slug, lesson_order, lesson_version)
values
  ('foundations', 3, 'what-is-code', 1, 3),
  ('foundations', 3, 'source-code-running-output', 2, 1),
  ('foundations', 3, 'hardware-operating-systems-apps', 3, 1),
  ('foundations', 3, 'files-folders-extensions', 4, 1),
  ('foundations', 3, 'paths-current-folder', 5, 1),
  ('foundations', 3, 'vscode-without-getting-lost', 6, 1),
  ('foundations', 3, 'terminal-without-fear', 7, 1),
  ('foundations', 3, 'values-variables-types', 8, 1),
  ('foundations', 3, 'decisions-loops-functions', 9, 1),
  ('foundations', 3, 'input-process-output-state', 10, 1),
  ('foundations', 3, 'languages-syntax-errors', 11, 1),
  ('foundations', 3, 'interpreters-compilers-runtimes', 12, 1),
  ('foundations', 3, 'packages-dependencies-environments', 13, 1),
  ('foundations', 3, 'frontend-backend-api-database-cloud', 14, 1),
  ('foundations', 3, 'internet-web-browser-server', 15, 1);

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
    )
), manifest_ids as (
  select
    'foundations'::text as course_slug,
    3 as curriculum_version,
    manifest.lesson_slug,
    step_id as progress_id,
    'step'::text as id_kind
  from manifest
  cross join lateral unnest(manifest.step_ids) step_id

  union all

  select
    'foundations'::text as course_slug,
    3 as curriculum_version,
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
