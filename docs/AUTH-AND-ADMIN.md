# Account, progress, and admin architecture

This document defines the authentication and learner-data boundary for the current product contract:

- Guests can open Lesson 1 (`/lessons/what-is-code`) without an account.
- Verified Google sign-ins unlock every published lesson.
- Progress sync is separate and optional.

## Product contract

| Visitor state | Learning access | Progress behavior | Primary account action |
| --- | --- | --- | --- |
| Guest | Lesson 1 only (`/lessons/what-is-code`) | Versioned storage on the current device | Optional sign in |
| Signed in (Google) | All published lessons | Progress remains local and can sync per account when the feature is enabled in that environment | Account access and optional sync status |
| Admin | Separate admin application only | Server-authorized curriculum operations | Role-protected admin session with MFA |

Guest access is limited to Lesson 1.
A verified Google account unlocks all published lessons; learning remains free.
Progress sync is separate from access control.

## Provider and domain decision

Use Supabase Auth with the project boundary used for this environment. This keeps identity, row-level security, and learner data in one boundary.

The branded account UI remains first-party:

- Staging: `https://staging.vibe-to-code.tech/sign-in`
- Production later: `https://vibe-to-code.tech/sign-in`
- Production auth/API custom domain later: `https://auth.vibe-to-code.tech`
- Future admin application: `https://admin.vibe-to-code.tech`

`auth.vibe-to-code.tech` is reserved for a future production Supabase auth custom domain. Keeping the login UI on the website avoids cross-subdomain session handoffs and keeps cookies host-only.
Never share auth cookies with `Domain=.vibe-to-code.tech`; only the environment that owns a Supabase project should configure matching redirect and OAuth settings.

Supabase custom domains require a paid project and add-on, so this repository documents optional future domain wiring.

## Sign-in methods

The public account UI currently supports:

1. Google OAuth using the configured Google web client.

Passwordless email-code modules are not enabled in this contract.

## Environment isolation

Recommended isolation uses environment-scoped Supabase + Google OAuth settings:

| Setting | Staging | Production |
| --- | --- | --- |
| Website origin | `https://staging.vibe-to-code.tech` | `https://vibe-to-code.tech` |
| Supabase project | environment-scoped Supabase project | environment-scoped Supabase project |
| Google redirect | environment callback URL | environment callback URL |
| SMTP | environment sender/config | environment sender/config |
| Learner data | environment-specific | environment-specific |

Vercel public environment variables:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<environment-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

The publishable key is safe in the browser only because every private table uses row-level security. Do not add a Supabase secret or service-role key to browser code. Normal account and progress operations do not need one.

Feature previews have no account access unless the exact branch is deliberately configured with branch-scoped Supabase variables.
If branch-scoped Supabase variables are not set, account-only lessons remain inaccessible. Never place production credentials in generic Preview scope.

### Staging provisioning values

Use these values before staging sign-in smoke tests:

| Console | Setting | Value |
| --- | --- | --- |
| Supabase URL configuration | Site URL | `https://staging.vibe-to-code.tech` |
| Supabase URL configuration | Redirect URL | `https://staging.vibe-to-code.tech/auth/callback` |
| Google OAuth web client | Authorized JavaScript origin | `https://staging.vibe-to-code.tech` |
| Google OAuth web client | Authorized redirect URI | `https://<staging-ref>.supabase.co/auth/v1/callback` |
| Vercel staging | Progress flag during auth smoke test | `NEXT_PUBLIC_PROGRESS_SYNC_ENABLED=false` |

Apply all pending database migrations and pass reset/account-switch tests before changing the staging progress flag to `true`.
Configure bot protection and suitable authentication rate limits before inviting broad testers.
Do not use wildcard production redirects and never place production credentials on generic preview scopes.

## Session and route boundary

- `@supabase/ssr` creates browser and server clients.
- Next.js `proxy.ts` refreshes cookie sessions before server code reads them.
- Server authorization uses verified claims from `getClaims()`, never `getSession()` alone.
- `/auth/callback` exchanges the OAuth PKCE code and accepts only a validated same-site relative return path.
- Learning routes are protected by contract; `/lessons/what-is-code` remains public and all other lesson routes require verified Google session claims.
- Account data and progress APIs authenticate on the server.
- Google OAuth secrets live in Supabase provider settings, not in Vercel public variables.

## Existing progress data

Progress is currently split across two independent browser stores:

| Store | Key | Data |
| --- | --- | --- |
| Course summary | `vibe-to-code:course-progress:v1:foundations` | Lesson completion, current checkpoint, attempts, hints, last visited lesson |
| Lesson detail | `vibe-to-code:lesson-progress:v1:<slug>:lesson-v<N>` | Current/completed steps, practice activities, attempts, saved code, completion |

The first lesson currently uses `lesson-v3`; the other published Foundation lessons use `lesson-v1`. A migration that reads only the course summary or assumes every lesson is version 1 loses learner data.

## Canonical progress model

The cloud record is schema version 2. It separates stable lesson achievements from versioned lesson detail and includes reset epochs:

- Course header: course slug, curriculum version, course epoch, server revision, last-visited pointer, legacy access flag.
- Stable lesson state: lesson epoch and completion timestamp.
- Versioned detail: current step, completed steps and activities, attempts, hints, and saved code.
- Device counters: an opaque random device ID scopes attempt and hint counters so retries are idempotent without fingerprinting the learner.

Lesson order, completion percentage, and unlock state are derived from the trusted curriculum manifest. They are never accepted from a browser payload. Staging review mode remains an environment capability and is never persisted as learner progress.

## First-account import and merge

On the first successful verified sign-in:

1. Read and validate both legacy stores using the exact lesson version in the manifest.
2. Fetch the learner's environment-specific cloud record.
3. Combine completion and activity IDs monotonically by stable ID.
4. Use the maximum legacy attempt count for matching aggregate/detail records because those stores mirror the same event; do not sum them.
5. Preserve aggregate hints and bounded detailed saved code.
6. Submit the merged record with an idempotency key and expected server revision.
7. Keep the legacy data until the server returns a durable receipt.
8. Store authenticated caches under an internal user-ID namespace, never an email namespace.

A failed or offline sync leaves guest data intact and retryable. Signing out switches back to the guest namespace so one account's cached data cannot be imported into another account on the same browser.

## Merge and reset safety

- Completed lesson, step, and activity sets use a union; the earliest valid completion timestamp wins.
- Mirrored legacy counters use `max`; independent device counter components also merge with `max` and totals are derived by summing device components.
- Navigation, current step, and saved code use field timestamps; ties keep the server value.
- A saved-code value is limited to 10,000 UTF-16 units, 40 KB UTF-8, and is never executed or rendered as HTML.
- Course reset increments the course epoch and clears every lesson/version atomically.
- Lesson reset increments that lesson's epoch and clears its stable and versioned state.
- A stale client with an older epoch receives a conflict and cannot resurrect reset progress.

The database functions lock each course row, compare the expected revision and epoch, and save an idempotency receipt in the same transaction.

## Data model and row-level security

The staging migration history creates and maintains:

- `profiles`: display attributes keyed by the Supabase auth user ID.
- `email_preferences`: separate marketing preference and consent/revocation timestamps.
- `curriculum_lessons`: the server validation manifest for known lessons and current versions.
- `learner_course_progress`: one bounded canonical document per user and course.
- `progress_sync_requests`: compact idempotency receipts.

Private records are readable only when `(select auth.uid())` matches the row's user ID. Progress writes use database functions that derive the user from `auth.uid()`, lock the row, and never accept `userId` or email from the request body.

## Admin application

`admin.vibe-to-code.tech` remains a separate protected Vercel project. It can share packages later, but must have its own deployment, OAuth configuration, environment variables, role records, and audit log.

Every admin page and mutation requires both:

1. A valid production session with a high enough authentication assurance level.
2. A server-owned `admin` or `editor` role, never user-editable metadata or a hard-coded email list.

The public website does not link to the admin domain. Attach it only after role checks, TOTP/AAL2 enforcement, audit logging, and recovery paths pass staging.

## Safe rollout

This remains the recommended rollout once a separate staging environment is approved and provisioned:

1. Create a staging Supabase project and Google OAuth client.
2. Run `supabase migration list`, reconcile local and remote history, then apply every pending tracked migration in ascending timestamp order. Never edit or re-run an applied migration.
3. Configure staging-only Vercel variables and Supabase redirect URLs.
4. Verify Google sign-in without enabling cloud progress sync.
5. Enable the two-store import and sync only on staging.
6. Test new, returning, offline, revoked, reset, multi-tab, multi-device, and account-switch sessions.
7. Approve privacy and terms copy before collecting production accounts or marketing consent.
8. Provision entirely new production credentials and repeat the migration. Never copy staging users, secrets, or progress into production.
