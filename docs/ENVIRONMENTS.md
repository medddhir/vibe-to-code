# Deployment environments

Vibe to Code uses one GitHub repository with isolated Vercel environments.

| Environment | Git branch | Domain | Purpose |
| --- | --- | --- | --- |
| Production | `main` | `https://vibe-to-code.tech` | Stable public website |
| Staging | `develop` | `https://staging.vibe-to-code.tech` | Integration, design, authentication, and release testing |
| Feature preview | `feature/*` or `agent/*` | Vercel-generated preview URL | Review one focused change before staging |

## Release flow

1. Build each change on a feature branch.
2. Open a pull request into `develop`.
3. Validate the Vercel preview and the stable staging domain.
4. Open a release pull request from `develop` into `main`.
5. Merge only after staging passes.
6. Verify the production deployment on `https://vibe-to-code.tech`.

Production and staging should use separate environment variables, OAuth clients, and data stores whenever user accounts or persistent data are involved. This is the recommended future architecture, not a claim that separate Supabase projects are already provisioned. Secrets must never be committed to this repository.

An account-enabled environment exposes only its Supabase project's public connection values to the Next.js app:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<environment-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Feature previews have no account access unless the exact branch is deliberately configured with branch-scoped Supabase variables. Never configure production Supabase credentials in generic Preview scope. A future staging project should be scoped to the `develop` deployment, with separate production values created for `main` only after staging account and progress QA passes. Google provider secrets belong in the matching Supabase project, not in Vercel public variables.

`NEXT_PUBLIC_UNLOCK_PUBLISHED_LESSONS=true` may unlock sequential curriculum navigation for authenticated reviewers. It never bypasses server authentication or makes protected lesson content public. Without branch-scoped Supabase variables, feature previews cannot provide account access and only Lesson 1 remains available.

The production admin application will use a separate protected Vercel project before `admin.vibe-to-code.tech` is attached.

The account UI stays on each website's `/sign-in` route. Reserve `auth.vibe-to-code.tech` for the paid production Supabase custom API/auth domain later; it is not required for staging. See [Account, progress, and admin architecture](./AUTH-AND-ADMIN.md).
