# Configure Supabase + Validate Authentication

## Why

Menu-GO currently depends on a local Docker PostgreSQL instance (`docker compose up -d`) with no managed cloud database. This blocks deploying the app with a persistent, production-grade database and makes the auth flow (NextAuth + Prisma adapter, which stores users/sessions in Postgres) untestable outside a developer machine. Moving the database to Supabase gives the project a managed Postgres with pooling, backups, and a dashboard — without changing the application's auth or data-access architecture.

## What Changes

- Create a new Supabase project for Menu-GO (no existing Supabase project matches; the only project in the account, `extranjeria-ia`, is unrelated).
- Point `DATABASE_URL` at the Supabase pooled connection (PgBouncer, port 6543) and add `DIRECT_URL` for Prisma migrations (direct connection, port 5432).
- Update the Prisma datasource in `packages/db` to use `directUrl` so `db:push`/migrations work against Supabase.
- Push the existing Prisma schema (`User`, `Account`, `Session`, `ConfigRestaurant`, `Dishes`, `Category`, …) to the Supabase database and seed it.
- Update `.env.example` and docs (`CLAUDE.md`, `README`) to document the Supabase-based setup alongside the Docker fallback.
- Validate authentication end-to-end against Supabase: NextAuth sign-in (Credentials provider locally; Google/Facebook if env keys present), Prisma adapter writes `User`/`Session` rows, session callback enriches `configRestaurantId`, middleware guards `/panel`.

**Out of scope:** migrating from NextAuth to Supabase Auth, replacing Prisma with supabase-js, Row Level Security policies (no direct client DB access exists — all access goes through the Next.js server).

## Capabilities

### New Capabilities
- `supabase-database`: Supabase project provisioning and connection configuration — pooled vs direct URLs, Prisma datasource wiring, schema push, and seed against the managed Postgres.
- `auth-validation`: Verifiable authentication behavior against the configured database — sign-in creates/reads `User` and `Session` rows, session enrichment with `configRestaurantId`, and `/panel` route protection.

### Modified Capabilities

(none — no existing specs in `openspec/specs/`)

## Impact

- **Env vars**: `DATABASE_URL` repointed; new `DIRECT_URL`; `.env.example` updated.
- **Code**: `packages/db/prisma/schema.prisma` (datasource `directUrl`); no app-code changes expected in `apps/menu-go`.
- **Infra**: new Supabase project (free tier expected; cost must be confirmed via `get_cost`/`confirm_cost` before creation). Docker Compose Postgres remains as optional local fallback.
- **Auth flow**: unchanged code path (NextAuth + PrismaAdapter), but now persists to Supabase — validation required.
