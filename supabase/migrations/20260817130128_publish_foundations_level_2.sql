-- Publish the complete Developer Foundations path as curriculum version 4.
-- Versions 2 and 3 remain immutable for rollback and trusted normalization.
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
