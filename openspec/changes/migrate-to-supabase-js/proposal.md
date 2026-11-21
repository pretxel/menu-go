# Proposal: Migrate data access from Prisma to supabase-js

## Why

menu-go now lives in the shared `gridscore` Supabase project (tables prefixed `mg_`), next to gridscore, retro-ball (`rb_*`) and travel-taste (`tt_*`). Those apps talk to Supabase with `supabase-js` and two env vars (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`). menu-go is the only one that needs a raw Postgres connection string, and therefore the database password, a pooler host, and Prisma CLI commands that are dangerous on a shared schema (`db push` / `migrate reset` would drop the other apps' tables). Moving to `supabase-js` aligns menu-go with the other apps and removes the password and the destructive tooling from the setup.

## What Changes

- Replace the Prisma client with a server-only `supabase-js` client created from `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, querying the existing `mg_*` tables.
- Rewrite every data call (~40 call sites in `actions.ts`, `r/[slug]/page.tsx`, `sitemap.ts`, the category and dish API routes, `auth.ts`) to `supabase.from('mg_…')`, using PostgREST embedding where Prisma used `include`.
- Move the three multi-step writes that use `prisma.$transaction` (bulk import, first publish, publish into an existing restaurant) into Postgres functions called with `rpc()`, so they stay atomic.
- Add a database migration that gives `mg_*` tables server-side defaults Prisma used to fill in app code: `id` defaults to `gen_random_uuid()`, `updatedAt` maintained by a trigger.
- Revoke `anon`/`authenticated` privileges on `mg_*` tables and the new functions; only `service_role` can reach them.
- **BREAKING** NextAuth switches from the Prisma adapter with database sessions to the JWT session strategy. Users and OAuth accounts are upserted into `mg_user` / `mg_account` from the `signIn` callback. Existing sessions are invalidated, but the new database has no users yet.
- Remove Prisma: `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg`, `@next-auth/prisma-adapter`, `schema.prisma`, `prisma.config.ts`, the `db:*` Prisma scripts and the shared-DB guard. `packages/db` keeps the SQL migrations, the seed and the generated Supabase types.
- Drop the now-unused `mg_session` and `mg_verification_token` tables.
- Vercel `menu-go-menu-go`: add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (same values as travel-taste), remove `DATABASE_URL` / `DIRECT_URL`.

**Out of scope:** Supabase Auth (NextAuth stays), client-side (browser) database access and RLS policies for it, migrating data from the paused `menu-go` Supabase project, fixing the known `Category` ownership gap. This change supersedes the database parts of the `configure-supabase-auth` change.

## Capabilities

### New Capabilities
- `data-access`: How menu-go reaches its data — server-only Supabase access with the service role, `mg_` table isolation inside the shared project, no anonymous access, and atomic multi-step writes.
- `auth-session`: Sign-in persistence and session contents — users and OAuth accounts recorded on sign-in, session carries the user id and `configRestaurantId`, `/panel` stays guarded.

### Modified Capabilities

(none — `one-step-publish`, `catalog-creation-funnel` and `shareable-menu-page` keep their behavior; only the persistence layer underneath changes)

## Impact

- **Code**: `apps/menu-go/src/lib/prisma.ts` → `src/lib/supabase.ts`; `src/app/actions.ts`, `src/app/r/[slug]/page.tsx`, `src/app/sitemap.ts`, `src/app/api/category/[categoryId]/route.ts`, `src/app/api/dishes/[dishId]/route.ts`, `src/lib/auth.ts`.
- **Tests**: suites that mock `../src/lib/prisma` (`actions`, `publish-catalog`, `r-slug-metadata`, `sitemap`) move to a Supabase client mock.
- **Database**: new migration on `gridscore` (defaults, trigger, RPC functions, privilege revokes, drop of two unused tables). `mg_` objects only.
- **Dependencies**: add `@supabase/supabase-js`; remove the Prisma stack and `@next-auth/prisma-adapter`.
- **Env / deploy**: two Supabase vars replace two Postgres URLs on Vercel; no database password anywhere.
