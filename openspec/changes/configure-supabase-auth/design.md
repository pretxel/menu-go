# Design: Configure Supabase + Validate Authentication

## Context

Menu-GO is a Next.js 16 Turborepo monorepo. Database access goes through Prisma 7 in `packages/db`:

- Runtime: `packages/db/src/client.ts` uses the `@prisma/adapter-pg` driver adapter with `process.env.DATABASE_URL` (node-postgres).
- CLI (push/migrate/seed): `packages/db/prisma.config.ts` (Prisma 7 config file) loads the root `.env` and sets `datasource.url` from `env('DATABASE_URL')`. The schema file itself has no `url` field.
- Auth: NextAuth (`apps/menu-go/src/lib/auth.ts`) with `PrismaAdapter`, Google/Facebook OAuth (optional via env), and a stub Credentials provider. Sessions/users persist in Postgres. Middleware guards `/panel` via the `next-auth.session-token` cookie.

Today the only database is local Docker Postgres (`docker compose up -d`). The Supabase account (org `Extrange.ia`) has one unrelated project (`extranjeria-ia`), so a new project must be created.

## Goals / Non-Goals

**Goals:**
- Provision a Supabase project for Menu-GO and wire the app to its Postgres.
- Keep Prisma migrations/seed working (`pnpm db:push`, `pnpm db:seed`).
- Validate the full auth flow against Supabase (sign-in → DB rows → enriched session → `/panel` access).
- Document setup so Docker remains an optional local fallback.

**Non-Goals:**
- Migrating NextAuth to Supabase Auth (GoTrue).
- Replacing Prisma with supabase-js or PostgREST.
- Row Level Security (no browser-side DB access exists; all queries run server-side).
- Fixing pre-existing auth issues (stub Credentials provider, global `Category` model) beyond noting them.

## Decisions

### 1. Supabase as managed Postgres only — keep NextAuth + Prisma
The cheapest path to "configured with Supabase" that preserves every line of app code. Alternative — Supabase Auth migration — was rejected: it replaces the adapter, session model, middleware cookie check, and login UI for no requirement stated in the proposal.

### 2. Two connection strings: pooled for runtime, session/direct for CLI
- `DATABASE_URL` → Supabase **transaction-mode pooler** (Supavisor, port 6543) for the Next.js runtime. Serverless-friendly; the pg driver adapter works with transaction pooling. Append `pgbouncer=true`-equivalent caveats do not apply to the pg adapter, but prepared statements must be avoided in transaction mode — Prisma's pg adapter handles this when pointed at Supavisor transaction mode.
- `DIRECT_URL` → **session-mode pooler** (port 5432 on the pooler host) for `prisma db push` / `migrate` / `seed`. Direct-to-db (`db.<ref>.supabase.co:5432`) is IPv6-only on the free tier, so the IPv4-compatible session pooler is the safer default.
- `prisma.config.ts` switches its `datasource.url` to `env('DIRECT_URL')` (falling back to `DATABASE_URL` if unset, preserving the Docker workflow where both are the same).

Alternative — single direct URL for everything — rejected: exhausts connections under serverless concurrency and breaks on IPv4-only networks.

### 3. Schema deployment via `prisma db push` + seed
The repo already standardizes on `db:push` (no committed migration history is required for this change). Pushing the existing schema creates `User`, `Account`, `Session`, `VerificationToken`, `ConfigRestaurant`, `Dishes`, `Category` in Supabase's `public` schema, then `db:seed` loads default categories.

Alternative — Supabase MCP `apply_migration` — rejected: Prisma owns the schema; duplicating it as raw SQL invites drift.

### 4. Validation is behavioral, not unit-test-only
Auth validation runs against the live Supabase DB: start dev server, sign in (Credentials stub locally; OAuth if keys present), then assert rows exist (`User`, `Session`) and the session JSON carries `configRestaurantId`, and `/panel` redirects anonymous requests to `/login`. Supabase `get_advisors` + `get_logs` run as a post-setup health check.

### 5. Project creation gated on cost confirmation
Supabase MCP requires `get_cost` → `confirm_cost` → `create_project`. Free tier allows 2 active projects (1 in use), so cost should be $0 — but the confirm step is mandatory and will be surfaced during apply.

## Risks / Trade-offs

- [Transaction pooling + prepared statements can error] → Use session pooler for CLI; if runtime errors appear (`prepared statement ... does not exist`), point runtime at session pooler or disable prepared statements in the pg pool config.
- [Free-tier project pauses after ~1 week inactivity] → Documented in README; `restore_project` MCP tool or dashboard resume.
- [Secrets in `.env`] → Only `.env.example` is committed with placeholders; real DB password stays local. Database password generated at project creation must be captured once.
- [Credentials provider is a stub (accepts anything, returns fixed user)] → Validation uses it only as a session-creation vehicle; flagged as pre-existing issue, not fixed here. Note: with the Prisma adapter + Credentials, NextAuth uses JWT for that provider — DB `Session` rows only appear for OAuth sign-ins, so DB-row assertions are scoped to OAuth or adapter-level checks.
- [Region latency] → Create project in region closest to the user (default `us-east-1` unless told otherwise; existing project is `eu-west-1` — pick same region for consistency).

## Migration Plan

1. `get_cost` / `confirm_cost` → `create_project` (org `rfugqrwvpvjceflrjmeg`, region `eu-west-1`).
2. Set `DATABASE_URL` (pooled) + `DIRECT_URL` (session pooler) in `.env`; update `.env.example`.
3. Edit `prisma.config.ts` to prefer `DIRECT_URL`.
4. `pnpm db:push` → `pnpm db:seed` → verify tables via MCP `list_tables`.
5. `pnpm dev` → exercise auth → assert DB rows + session payload + `/panel` guard.
6. Rollback: restore previous `DATABASE_URL` (Docker), delete Supabase project if abandoned.

## Open Questions

- Region preference (defaulting to `eu-west-1`, matching the existing project).
- Should production deploys (Vercel) get these env vars now? Out of scope unless asked.
