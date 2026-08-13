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

Production and staging must use separate environment variables, OAuth clients, and data stores whenever user accounts or persistent data are involved. Secrets must never be committed to this repository.

Account-enabled environments use separate Supabase projects and expose only the project's public connection values to the Next.js app:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<environment-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Do not configure production Supabase values for generic preview deployments. Scope staging values to the `develop` deployment and create new values for `main` only after staging account and progress QA passes. Google provider secrets and SMTP credentials belong in the matching Supabase project, not in Vercel public variables.

Published Foundation lessons are all unlocked for curriculum review in Vercel preview environments, including the `develop` deployment behind `staging.vibe-to-code.tech`. Production keeps the guided sequential unlock path. `NEXT_PUBLIC_UNLOCK_PUBLISHED_LESSONS=true` can explicitly enable review mode, while `false` is an emergency off switch for any environment.

The production admin application will use a separate protected Vercel project before `admin.vibe-to-code.tech` is attached.

The account UI stays on each website's `/sign-in` route. Reserve `auth.vibe-to-code.tech` for the paid production Supabase custom API/auth domain later; it is not required for staging. See [Account, progress, and admin architecture](./AUTH-AND-ADMIN.md).
