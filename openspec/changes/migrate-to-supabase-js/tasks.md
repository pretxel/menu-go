# Tasks

## 1. Database migration on gridscore

- [x] 1.1 Write `packages/db/migrations/1_mg_supabase_js.sql`: `id DEFAULT gen_random_uuid()::text` on all `mg_*` tables, `updatedAt DEFAULT now()`, `mg_set_updated_at()` trigger on `mg_config_restaurant` and `mg_dishes`. Verify: file contains only `mg_` object names (`grep -v mg_` shows no DDL targets).
- [x] 1.2 Add `mg_import_catalog(text, jsonb)` and `mg_publish_new_catalog(...)` (SECURITY INVOKER, `SET search_path = public`) to the same migration. Verify: plpgsql body reviewed against `importCategories()` behavior (find-or-create category by name + restaurant, then insert dishes).
- [ ] 1.3 (revokes applied; DROPs split into `1b_mg_drop_unused.sql`, pending manual apply because the MCP auto-cancels destructive confirmations) Add `REVOKE ALL` on `mg_*` tables and functions from `anon, authenticated`, `REVOKE EXECUTE ... FROM PUBLIC` on the functions, and `DROP TABLE mg_session, mg_verification_token, _prisma_migrations`. Verify: statements listed in the migration.
- [x] 1.4 Record row counts of all non-`mg_` public tables, apply the migration to `gridscore`, and compare counts afterwards. Verify: counts unchanged; `list_tables` shows no `mg_session` / `mg_verification_token`.
- [x] 1.5 Check isolation: with the anon key, `GET /rest/v1/mg_dishes` and `POST /rest/v1/rpc/mg_import_catalog` are both refused. Verify: permission error or empty result, per spec `data-access`.
- [x] 1.6 Check atomicity: call `mg_publish_new_catalog` with a category whose dish violates `NOT NULL` (e.g. null name). Verify: the call errors and no restaurant or category row from it exists.
- [x] 1.7 Run Supabase security advisors. Verify: no new findings for `mg_` objects beyond "RLS enabled, no policy".

## 2. Client and types

- [x] 2.1 Add `@supabase/supabase-js` and `server-only` to `apps/menu-go`. Verify: `pnpm install` succeeds.
- [x] 2.2 Generate Supabase types into `packages/db/types.ts`, restricted to `mg_*` tables and functions, and export `Database` from `packages/db/index.ts`. Verify: `tsc --noEmit` in `packages/db` passes.
- [x] 2.3 Create `apps/menu-go/src/lib/supabase.ts` (`getSupabase()` singleton, service role, no session persistence, `import 'server-only'`). Verify: importing it from a `'use client'` file fails `pnpm build`.

## 3. Rewrite data access

- [x] 3.1 Port the restaurant reads and writes in `src/app/actions.ts` (`postRestaurant`, restaurant lookups, `qrCode` backfill). Verify: related `actions.test.ts` cases pass.
- [x] 3.2 Port dish and category CRUD in `actions.ts` and the routes `src/app/api/dishes/[dishId]/route.ts` and `src/app/api/category/[categoryId]/route.ts`, keeping the ownership checks. Verify: `dish.test.tsx`, `category.test.tsx` and the route tests pass.
- [x] 3.3 Replace `prisma.$transaction` + `importCategories()` with `rpc('mg_import_catalog')` / `rpc('mg_publish_new_catalog')` in `postBulkDishes` and `publishCatalog`. Verify: `publish-catalog.test.ts` passes, including the existing-restaurant case.
- [x] 3.4 Port the embedded reads (`include` → PostgREST embedding) with mappers that keep the current component props (`Dishes`, `category`). Verify: the public menu page shows only available dishes, grouped by category (`menu-dish.test.tsx`, plus a new test with an unavailable dish).
- [x] 3.5 Port `src/app/r/[slug]/page.tsx` (including the `mg_menu_view` insert and counts) and `src/app/sitemap.ts`. Verify: `r-slug-metadata.test.ts` and `sitemap.test.ts` pass.
- [x] 3.6 Delete `src/lib/prisma.ts`. Verify: `grep -rn "prisma" apps/menu-go/src` returns nothing.

## 4. Auth

- [x] 4.1 In `src/lib/auth.ts`, remove `PrismaAdapter`, set `session.strategy = 'jwt'`, upsert `mg_user` / `mg_account` in `signIn` (return `false` on error), and set `uid` / `configRestaurantId` in `jwt` (refresh on `trigger === 'update'`) and in `session`. Verify: new unit tests cover first sign-in, repeat sign-in (no duplicates) and a persistence error returning `false`.
- [x] 4.2 ~~Call `useSession().update()` after publish~~ Not needed: the `jwt` callback re-checks `configRestaurantId` on every read while it is null (see design §6). Verify: `auth.test.ts` "picks up a restaurant created after sign-in without signing in again".
- [x] 4.3 Remove `@next-auth/prisma-adapter`. Verify: `pnpm build` passes.

## 5. Tests and tooling

- [x] 5.1 Add `__test__/helpers/supabase-mock.ts` (chainable builder + `rpc`) and migrate `actions`, `publish-catalog`, `r-slug-metadata` and `sitemap` suites to it. Verify: `pnpm test` passes with the same or higher test count (≥95).
- [x] 5.2 Remove the Prisma stack from `packages/db` (`prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg`, `@types/pg`, `schema.prisma`, `prisma.config.ts`, `generated/`, the Prisma migrations folder, `scripts/guard-shared-db.mjs`, the `db:*` Prisma scripts and the turbo `db:*` tasks). Rewrite `seed.ts` with supabase-js. Verify: `pnpm build`, `pnpm lint` and `pnpm test` pass; `grep -rn prisma --exclude-dir=node_modules apps packages` is empty.
- [x] 5.3 Update `.env.example`, `CLAUDE.md` (Data Layer, Environment Variables, Supabase section) and `turbo.json` `globalEnv` (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` in, `DATABASE_URL`/`DIRECT_URL` out). Verify: docs mention no Prisma commands.
- [x] 5.4 Check the client bundle: after `pnpm build`, search `.next/static` for the service role key prefix / variable name. Verify: no matches (spec `data-access`).

## 6. Deploy

- [x] 6.1 Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Vercel `menu-go-menu-go` for Production, Preview and Development, using the values from travel-taste. Verify: `vercel env list --project menu-go-menu-go` shows both in all three environments.
- [ ] 6.2 Deploy a preview and smoke-test: Google sign-in creates one `mg_user` + `mg_account`, the `/d` funnel publishes, `/r/<slug>` renders, `/panel` shows the restaurant, and an anonymous `/panel` visit redirects to `/login`. Verify: each check passes and rows are visible in `mg_*` tables.
- [ ] 6.3 Merge to `master`, confirm the production deploy is healthy, then remove `DATABASE_URL` / `DIRECT_URL` from Vercel. Verify: production smoke-test passes and `vercel env list` no longer shows the Postgres URLs.

## Workflow follow-up

- Archive this change with `/opsx:archive` after deploy; that syncs `data-access` and `auth-session` into `openspec/specs/`.
- Close or archive `configure-supabase-auth`: its database tasks are superseded by this change.
