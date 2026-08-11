# Account and admin architecture

This document defines the boundary for the next product milestone. It does not provision credentials, attach `admin.vibe-to-code.tech`, or make the public curriculum require an account.

## Product contract

| Visitor state | Learning access | Progress behavior | Primary account action |
| --- | --- | --- | --- |
| Guest | All public lessons | Versioned `localStorage` on the current device | Optional “Continue with Google” |
| Signed in | All public lessons | Synced to the environment-specific data store | Profile and sync status |
| Admin | Separate admin application only | Server-authorized curriculum operations | Role-protected admin session |

Guest learning remains a first-class path. Signing in must add cross-device continuity, not create a paywall or block the first lesson.

## Recommended public-site auth

Use Clerk with Google as the initial social identity provider. Clerk is the lowest-friction fit for the existing Next.js and Vercel stack, provides server-side route protection, and keeps the website team out of password storage.

Implementation requirements:

1. Provision separate Clerk applications for staging and production.
2. Install the provider only when the staging keys and callback domains are ready.
3. Add a first-party `/sign-in` route and return learners to the page they started from.
4. Keep all lesson and course routes public.
5. Protect progress APIs and account pages on the server; client-side hiding is not authorization.
6. Store only publishable values in `NEXT_PUBLIC_*`. Secret keys and database credentials remain server-only.

Do not render a working-looking Google button until the staging OAuth application can complete the full callback flow.

## Progress migration and merge

The existing `vibe-to-code:course-progress:v1` record is valuable user data. On the first successful sign-in:

1. Read and validate the local record using its versioned schema.
2. Fetch the learner's server record.
3. Merge completed checkpoints and lessons by stable IDs; never replace a more-complete side with a less-complete side.
4. Preserve attempts and hint usage using the higher safe value for each checkpoint.
5. Write the merged record in one server transaction with an idempotency key.
6. Return the canonical record, update the client store, and show a small “Progress synced” confirmation.

The sync endpoint must reject unknown lesson IDs, oversized payloads, and records for a different curriculum version. A failed sync must leave local progress intact and retryable.

## Data boundary

Staging and production need separate databases or isolated schemas with separate credentials. A minimal server model needs:

- `users`: internal ID, provider subject, primary email, display fields, created and updated timestamps.
- `course_progress`: user ID, course slug, curriculum version, canonical progress JSON, updated timestamp.
- `progress_events` (optional but recommended): idempotency key, user ID, event type, lesson/checkpoint IDs, timestamp.
- `roles`: user ID, environment, role, granted-by, granted timestamp.

Email is a display/contact attribute, not the authorization key. Use the provider subject plus the internal user ID.

## Admin application

`admin.vibe-to-code.tech` should be a separate protected Vercel project. It may share packages or a repository later, but it must have its own deployment, environment variables, OAuth configuration, and allow-listed domain.

Admin access requires two independent checks:

1. A valid authenticated session.
2. A server-side role such as `admin` or `editor` stored in the environment-specific data store.

Do not rely on an unlisted URL, a hidden navigation link, an email string in client code, or Vercel deployment protection as the product authorization layer. Every admin page, server action, and API mutation must check the role on the server. Record sensitive curriculum and user-support mutations in an audit log.

The public website should not link to the admin domain. The admin domain is attached only after its authentication, authorization, audit, and recovery paths pass staging QA.

## Safe rollout

1. Provision staging auth and staging data only.
2. Implement sign-in and sign-out with no progress sync.
3. Add idempotent local-to-server progress merge behind a staging-only feature flag.
4. Test new, returning, offline, revoked, and multi-device sessions.
5. Build the separate admin project with role checks and audit logging.
6. Complete accessibility, security, and rollback review.
7. Repeat provisioning with new production credentials; never copy staging secrets or user data into production.
