# Design: Migrate data access from Prisma to supabase-js

## Context

See proposal.md (Why). Current state relevant to the approach:

- The `mg_*` tables already exist on `gridscore` (baseline migration `0_init_mg_prefix`), with RLS enabled and no policies. They were generated from the Prisma schema, so **ids have no database default** (Prisma generated `uuid()` client-side) and **`updatedAt` has no default or trigger** (Prisma's `@updatedAt` was client-side). Columns are camelCase and quoted (`"configRestaurantId"`).
- Data calls: about 40 Prisma calls, mostly `findFirst`/`create`/`update`/`count`. Nested reads use `include` in four places in `actions.ts` (dishes with category; restaurant with available dishes and their categories) and once in `auth.ts`. Three `prisma.$transaction` blocks all funnel through `importCategories()` (find-or-create category, then insert dishes).
- Auth: NextAuth v4 with `PrismaAdapter` and the default **database session** strategy (the `session` callback receives `user` and re-reads `ConfigRestaurant` on every request). `src/proxy.ts` only checks that a `next-auth.session-token` cookie exists. No email provider is configured, so `mg_verification_token` is never used. The Credentials provider is a dev stub that always returns the same fake user.
- travel-taste and gridscore already use `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` on Vercel.

## Goals / Non-Goals

**Goals:**
- Behavior-preserving swap of the persistence layer: the funnel, publish, panel and public menu work exactly as before.
- Keep the multi-step writes atomic (spec `data-access`, Atomic catalog imports).
- Typed queries using generated Supabase types.

**Non-Goals:**
- No browser-side Supabase client and no RLS policies: all access stays in server actions, route handlers and server components.
- No change to the Credentials dev stub, the `Category` ownership model, or QR storage.
- No query optimization beyond what the swap naturally gives.

## Decisions

### 1. One server-only client, service role key
`src/lib/supabase.ts` exports `getSupabase()`, a lazily-created singleton built with `createClient<Database>(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })`. The module imports `server-only` so a client-component import fails the build.
- *Why service role:* access is server-side only, and the service role bypasses RLS, so the existing "RLS on, no policies" setup keeps the public API closed with nothing else to maintain.
- *Alternative:* anon key plus RLS policies keyed on a NextAuth-minted Supabase JWT. Rejected: it needs custom JWT signing and per-table policies, for no gain while nothing runs in the browser.

### 2. Defense in depth: revoke `anon`/`authenticated` grants
Supabase's default privileges grant `anon` and `authenticated` full table privileges on new `public` tables, and RLS is currently the only barrier. The migration also runs `REVOKE ALL` on `mg_*` tables and the new functions from `anon, authenticated` (and `REVOKE EXECUTE ... FROM PUBLIC` on the functions), keeping `service_role`. A forgotten `ENABLE ROW LEVEL SECURITY` on a future table then still does not leak.

### 3. Atomic writes via Postgres functions
`supabase-js` (PostgREST) has no client-side transactions. A function body runs inside a single transaction, so:
- `mg_import_catalog(p_config_restaurant_id text, p_categories jsonb) returns void`: loops categories, finds or creates each by `(name, configRestaurantId)`, inserts its dishes. It replaces `importCategories()` and serves both bulk import and publish into an existing restaurant.
- `mg_publish_new_catalog(p_user_id text, p_name text, p_address text, p_phone text, p_slug text, p_qr_code text, p_categories jsonb) returns mg_config_restaurant`: inserts the restaurant, then performs the import in the same transaction, and returns the row.

Both are `SECURITY INVOKER` (they run as `service_role`, which already has the privileges), with `SET search_path = public` so the advisor's mutable search_path warning does not apply. The QR code and slug are still computed in TypeScript before the call, as they are today.
- *Alternative:* sequential inserts with compensating deletes on failure. Rejected: not truly atomic, and more code.

### 4. Database owns ids and timestamps
A migration sets `id DEFAULT gen_random_uuid()::text` on every `mg_*` table, sets `updatedAt DEFAULT now()`, and adds an `mg_set_updated_at()` trigger (BEFORE UPDATE) on `mg_config_restaurant` and `mg_dishes`. Column types stay the same, so existing ids keep working.

### 5. Reads: PostgREST embedding replaces `include`
`include: { category: true }` becomes `.select('*, category:mg_category(*)')`. The restaurant page query becomes `.select('*, dishes:mg_dishes(*, category:mg_category(*))').eq('dishes.isAvailable', true)`. FK-based embedding works because the baseline migration created named foreign keys. Result shapes are mapped back to the property names the components already use (`Dishes`, `category`) in one small mapper per query, so UI components do not change.

### 6. Auth: JWT sessions, persistence in `signIn`
Drop the adapter and set `session: { strategy: 'jwt' }`.
- `signIn({ user, account })`: upsert `mg_user` on `email` (unique index already exists), then for OAuth accounts upsert `mg_account` on `(provider, providerAccountId)`. A thrown error returns `false`, which makes NextAuth show the error page (spec `auth-session`: persistence failure blocks sign-in).
- `jwt({ token, user })`: on sign-in, store the `mg_user.id` in `token.uid`. While `configRestaurantId` is still null, it is looked up again on every token read, so a restaurant created mid-session appears without the client calling `update()` (one indexed query per request only for users who have no restaurant yet). *(Implementation note: this replaced the original plan of calling `useSession().update()` from the funnel.)*
- `session({ session, token })`: copy `uid` and `configRestaurantId` from the token.
- `src/proxy.ts` is unchanged: the JWT session cookie has the same name.
- *Alternative:* a custom NextAuth adapter over supabase-js targeting `mg_*` (10+ methods), keeping database sessions. Rejected: more code to maintain, and nothing needs server-side session revocation today.
- *Alternative:* `@auth/supabase-adapter`. Rejected: it requires its own tables in a `next_auth` schema exposed through the API, which breaks the `mg_` isolation rule.

### 7. `packages/db` becomes types + SQL
`packages/db` keeps `migrations/*.sql` (plain SQL, applied with the Supabase MCP/CLI to `gridscore`, recorded in `supabase_migrations`), `seed.ts` (rewritten with supabase-js), and `types.ts` generated by `supabase gen types` (or MCP `generate_typescript_types`), filtered to `mg_*` tables and functions. Prisma, its config, the generated client, the `_prisma_migrations` row and the shared-DB guard script are removed.

### 8. Tests mock the client, not the database
A shared `__test__/helpers/supabase-mock.ts` returns a chainable query-builder mock (`from().select().eq().maybeSingle()` resolving to `{ data, error }`) plus an `rpc` mock. The four suites that mock `../src/lib/prisma` switch to `jest.mock('../src/lib/supabase')`. The assertions keep checking the same behaviors: which rows are written, with what values.

## Risks / Trade-offs

- [PostgREST embedding filters differ from Prisma's nested `where`: `.eq('dishes.isAvailable', true)` filters embedded rows, not parents] → Covered by the public menu page test with unavailable dishes.
- [Losing Prisma's compile-time relation typing] → Generated `Database` types plus small typed mappers. Regenerating types is a task step after every migration.
- [`signIn` upsert runs on every sign-in] → Two indexed upserts, negligible at this scale.
- [JWT sessions cannot be revoked server-side until they expire] → Acceptable for this app. Session `maxAge` is left at the NextAuth default (30 days).
- [Service role key in Vercel env is all-powerful over the whole `gridscore` project, including other apps' data] → Same exposure travel-taste and gridscore already accept. The key is used only in `src/lib/supabase.ts`, guarded by `server-only`, and never prefixed `NEXT_PUBLIC_`.
- [`jsonb` RPC input is untyped at the database boundary] → Input is already validated with Zod in the server action before the call. The function casts fields explicitly.

## Migration Plan

1. Apply migration `1_mg_supabase_js` to `gridscore`: defaults, trigger, both RPC functions, revokes, `DROP TABLE mg_session, mg_verification_token`, `DROP TABLE _prisma_migrations` (only menu-go uses it). Verify non-`mg_` tables are untouched (row counts before and after).
2. Generate types. Land the code swap and tests on a branch; `pnpm build`, `pnpm test` and `pnpm lint` must pass.
3. Vercel `menu-go-menu-go`: add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for Production, Preview and Development (copied from travel-taste). Deploy a preview and smoke-test: sign in with Google, run the `/d` funnel, publish, open `/r/<slug>`, check the panel.
4. Merge to `master` (production deploy). Remove `DATABASE_URL` / `DIRECT_URL` from Vercel.

**Rollback:** the database migration is additive except for the two dropped (empty, unused) tables, and the Prisma code reads the same `mg_*` tables. Reverting the merge and restoring the two Postgres env vars brings back the Prisma build; re-creating `mg_session` / `mg_verification_token` from `0_init_mg_prefix` is needed only for a rollback.

## Open Questions

- Whether `supabase gen types` is run via the Supabase CLI or the MCP tool can be decided at implementation time; the output file is the same.
