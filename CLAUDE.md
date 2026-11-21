# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Menu-GO** (branded as "Dineqrs") is a QR-based digital menu management SaaS platform for restaurants. Restaurants create menus, generate QR codes, and customers scan the QR to view the menu. Built as a Next.js 16 full-stack monorepo.

## Commands

All root-level commands use `dotenv -e .env` to inject environment variables before running Turborepo.

```bash
# Development
pnpm dev              # Start dev server (loads .env automatically)
pnpm build            # Production build
pnpm lint             # ESLint check across all packages
pnpm lint:fix         # Auto-fix lint issues

# Testing
pnpm test             # Run Jest tests across all packages

# Database
pnpm db:seed          # Seed global categories (supabase-js, idempotent)

# Run a single Jest test file
cd apps/menu-go && pnpm test -- --testPathPattern=<filename>
```

The app is available at `http://localhost:3000`.

## Monorepo Structure

```
menu-go-frontend/
├── apps/menu-go/          # Main Next.js 16 app
├── packages/
│   ├── db/                # Supabase types, SQL migrations, seed (mg_* tables)
│   ├── ui/                # Shared React UI components (bundled via Rollup)
│   ├── config/            # Shared Next.js, ESLint, Jest configs
│   ├── tsconfig/          # Shared TypeScript configs
│   └── tailwind-config/   # Shared Tailwind configuration
```

Path alias `@/*` maps to `apps/menu-go/src/*`.

## Architecture

### Routing (Hybrid: Pages + App Router)

The app uses **both** Next.js routers simultaneously:

- **Pages Router** (`src/pages/`): Public-facing pages — `/` (landing), `/login`, `/learn`, `/privacy`
- **App Router** (`src/app/`): Protected panel and API — `/panel/**`, `/menu/[restaurantId]`, `/api/**`

Middleware at `src/middleware.ts` guards `/panel` routes, checking for a valid `next-auth.session-token` cookie.

### Authentication

NextAuth.js (`src/lib/auth.ts`) with:
- Providers: Google OAuth, Facebook OAuth, Credentials (email + password)
- No adapter: JWT session strategy (`next-auth.session-token` cookie). The `signIn` callback upserts OAuth users into `mg_user` (by lowercased email) and their accounts into `mg_account`
- Email/password: `POST /api/sign-up` creates the account (`src/lib/sign-up.ts`); `authorizeCredentials()` checks it. Passwords are scrypt hashes (`src/lib/password.ts`) in `mg_user.password`. 5 failed attempts lock the account for 15 min (`failedLoginCount`, `lockedUntil`). Emails are stored lowercased (DB check constraint)
- Sign-up does not verify email ownership (no email provider yet), so an OAuth sign-in for an email whose password account is unverified sets `emailVerified` and clears that password
- The `jwt` callback stores the `mg_user` id (`token.uid`) and `configRestaurantId`; while the user has no restaurant it re-checks on every read, so one created mid-session shows up without re-login

### Data Layer

Data access uses **supabase-js** from server code only: `getSupabase()` in `src/lib/supabase.ts` (service role key, guarded by `server-only`; importing it from a client component fails the build). Wrap responses with `unwrap()` to throw on errors. Row types come from `packages/db/types.ts` (`import type { Dishes } from 'db'`). Tables (camelCase quoted columns):
- `mg_user` / `mg_account` — auth user with linked OAuth accounts
- `mg_config_restaurant` — restaurant profile (name, address, phone, image, QR code as base64)
- `mg_dishes` — menu items linked to a restaurant and category
- `mg_category` — categories; `configRestaurantId IS NULL` means global (shared across restaurants)
- `mg_menu_view` — menu view tracking (`source`: direct / qr)

Multi-step writes are Postgres functions called with `rpc()` so they stay atomic: `mg_import_catalog` (find-or-create categories + insert dishes) and `mg_publish_new_catalog` (restaurant + catalog). Tests use the in-memory fake in `apps/menu-go/__test__/helpers/supabase-fake.ts`.

### Mutations: Server Actions

Data writes go through server actions in `src/app/actions.ts` rather than API routes:
- `postDish()` — create/update a dish (receives FormData)
- `postRestaurant()` — create/update restaurant config + generates QR code
- `updateDish()` — update dish image via Vercel Blob upload

Forms use `useFormState` (deprecated — should migrate to `useActionState` for React 19 compatibility).

### File Storage

Images are uploaded to **Vercel Blob** via `POST /api/upload`. QR codes are stored as base64 strings directly in the database (known inefficiency — see IMPROVEMENTS.md).

### Internationalization

i18n uses `next-i18next` (configured in `next-i18next.config.js`). Translation JSON files live in `public/locales/`. The landing page and public routes are i18n-enabled.

## Environment Variables

Required in `.env` (see `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL= # https://dfllsojtcwryhkvoetfh.supabase.co (shared gridscore project)
SUPABASE_SERVICE_ROLE_KEY= # server-only; same value as gridscore / travel-taste on Vercel
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
EMAIL_SERVER=             # SMTP for email auth
EMAIL_FROM=
SECRET=                   # NextAuth secret
```

The database is the shared Supabase project `gridscore` (ref `dfllsojtcwryhkvoetfh`, region `eu-west-1`). Its `public` schema also holds other apps (gridscore core tables, `rb_*`, `tt_*`), so **every menu-go object is prefixed `mg_`**. The `mg_*` tables have RLS enabled with no policies and no `anon`/`authenticated` grants: only the service role (server) can reach them.

Schema changes are plain SQL files in `packages/db/migrations/`, applied to `gridscore` with the Supabase MCP (`apply_migration`) or the SQL editor. They must create/alter/drop **only `mg_` objects**, and every new table or function needs the same RLS + `REVOKE ... FROM anon, authenticated` treatment. After a schema change, regenerate `packages/db/types.ts` (MCP `generate_typescript_types`, keep only `mg_*`). There is no local database: Docker Postgres cannot serve supabase-js. The old `menu-go` Supabase project (`fbbulaxuwkddxdykilmv`) is paused and no longer used.

## Known Issues

See `IMPROVEMENTS.md` for a full list. Critical ones to be aware of:

- `NEXT_PUBLIC_SIE` env var has a typo (affects QR code URL generation)
- `Category` model has no restaurant ownership — categories are globally shared across all users
- QR codes stored as large base64 in DB instead of object storage
- `useFormState` is deprecated; should use `useActionState`
- Server actions lack input validation (no Zod/schema validation)
