# Account, progress, and admin architecture

This document defines the authentication and learner-data boundary. The first rollout is staging-only. It does not attach production domains, copy staging users into production, or make any public lesson require an account.

## Product contract

| Visitor state | Learning access | Progress behavior | Primary account action |
| --- | --- | --- | --- |
| Guest | All public lessons | Versioned storage on the current device | Optional sign in |
| Signed in | All public lessons | Guest progress is safely combined, then synced per account | Account and sync status |
| Admin | Separate admin application only | Server-authorized curriculum operations | Role-protected admin session with MFA |

Guest learning remains a first-class path. An account adds cross-device continuity and does not create a paywall.

## Provider and domain decision

Use Supabase Auth with the same Supabase Postgres project that stores progress. This keeps identity, row-level security, and learner data in one boundary.

The branded account UI remains first-party:

- Staging: `https://staging.vibe-to-code.tech/sign-in`
- Production later: `https://vibe-to-code.tech/sign-in`
- Production auth/API custom domain later: `https://auth.vibe-to-code.tech`
- Future admin application: `https://admin.vibe-to-code.tech`

`auth.vibe-to-code.tech` is reserved for the production Supabase API and OAuth callback boundary. It is not a second login website. Keeping the login UI on the website avoids cross-subdomain session handoffs and keeps cookies host-only. Never share auth cookies with `Domain=.vibe-to-code.tech`; staging and production use different projects and signing keys.

Supabase custom domains require a paid project and add-on, so staging uses its default `https://<project-ref>.supabase.co` endpoint. The custom production auth domain can be attached immediately before public account launch.

## Sign-in methods

The first release supports:

1. Google OAuth using a separate Google web client in each environment.
2. Passwordless email with a six-digit one-time code.

Email OTP confirms that the learner controls the inbox before a usable session is created. It does not prove a person's real-world identity and cannot eliminate every disposable inbox. Disposable-domain blocking is intentionally deferred because it creates false positives and needs ongoing list maintenance.

The Supabase email template must render `{{ .Token }}` for the six-digit flow. Custom SMTP is required before enabling email-code sign-in: new Free projects using Supabase's default mailer cannot customize authentication templates, so the required token template cannot be installed there. Account service email is necessary for authentication; marketing email is a separate, unchecked preference with its own timestamped consent record.

## Environment isolation

Create two independent Supabase projects and two Google OAuth web clients:

| Setting | Staging | Production |
| --- | --- | --- |
| Website origin | `https://staging.vibe-to-code.tech` | `https://vibe-to-code.tech` |
| Supabase project | Staging-only | Production-only |
| Google redirect | `https://<staging-ref>.supabase.co/auth/v1/callback` | Supabase production callback, then `https://auth.vibe-to-code.tech/auth/v1/callback` after activation |
| SMTP | Staging sender/config | Production sender/config |
| Learner data | Test accounts and progress only | Real accounts and progress only |

Vercel public environment variables:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<environment-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

The publishable key is safe in the browser only because every private table uses row-level security. Do not add a Supabase secret or service-role key to browser code. Normal account and progress operations do not need one.

### Staging provisioning values

Use these exact staging boundaries before the first live test:

| Console | Setting | Value |
| --- | --- | --- |
| Supabase URL configuration | Site URL | `https://staging.vibe-to-code.tech` |
| Supabase URL configuration | Redirect URL | `https://staging.vibe-to-code.tech/auth/callback` |
| Google OAuth web client | Authorized JavaScript origin | `https://staging.vibe-to-code.tech` |
| Google OAuth web client | Authorized redirect URI | `https://<staging-ref>.supabase.co/auth/v1/callback` |
| Supabase email template | OTP body | Include `{{ .Token }}` so the learner receives a six-digit code |
| Supabase auth providers | Anonymous sign-ins | Disabled |
| Vercel staging | Progress flag during auth smoke test | `NEXT_PUBLIC_PROGRESS_SYNC_ENABLED=false` |

Apply the database migration and pass reset/account-switch tests before changing the staging progress flag to `true`. Configure custom SMTP, SPF, DKIM, DMARC, bot protection, and suitable email rate limits before inviting public testers. Do not use wildcard production redirects.

## Session and route boundary

- `@supabase/ssr` creates browser and server clients.
- Next.js `proxy.ts` refreshes cookie sessions before server code reads them.
- Server authorization uses verified claims or a fresh `getUser()` result, never `getSession()` alone.
- `/auth/callback` exchanges the OAuth PKCE code and accepts only a validated same-site relative return path.
- Learning routes stay public. Account data and progress APIs authenticate on the server.
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

The staging migration creates:

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

1. Create the staging Supabase project, Google OAuth client, and SMTP sender.
2. Apply both tracked files in `supabase/migrations/` to staging in version order.
3. Configure staging-only Vercel variables and Supabase redirect URLs.
4. Verify Google and email-code sign-in without enabling cloud migration.
5. Enable the two-store import and sync only on staging.
6. Test new, returning, offline, revoked, reset, multi-tab, multi-device, and account-switch sessions.
7. Approve privacy and terms copy before collecting production accounts or marketing consent.
8. Provision entirely new production credentials and repeat the migration. Never copy staging users, secrets, or progress into production.
