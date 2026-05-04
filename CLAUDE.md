# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Menu-GO** (branded as "Dineqrs") is a QR-based digital menu management SaaS platform for restaurants. Restaurants create menus, generate QR codes, and customers scan the QR to view the menu. Built as a Next.js 15 full-stack monorepo.

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
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to DB + regenerate client
pnpm db:seed          # Seed database
pnpm db:reset         # Reset database

# Run a single Jest test file
cd apps/menu-go && pnpm test -- --testPathPattern=<filename>

# Docker (start local PostgreSQL)
docker compose up -d
```

The app is available at `http://localhost:3000`.

## Monorepo Structure

```
menu-go-frontend/
├── apps/menu-go/          # Main Next.js 15 app
├── packages/
│   ├── db/                # Prisma schema + client (shared database layer)
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
- Providers: Google OAuth, Facebook OAuth, Credentials
- Adapter: Prisma (stores users/sessions in PostgreSQL)
- Session callback enriches session with `configRestaurantId` from the database
- JWT strategy with `next-auth.session-token` cookie

### Data Layer

Prisma client lives in `packages/db/`. Key models:
- `User` — auth user with linked OAuth accounts
- `ConfigRestaurant` — restaurant profile (name, address, phone, image, QR code as base64)
- `Dishes` — menu items linked to a restaurant and category
- `Category` — globally shared categories (no per-restaurant isolation currently)

Import the shared client: `import { prisma } from 'db'`

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
DATABASE_URL=             # PostgreSQL connection string
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
EMAIL_SERVER=             # SMTP for email auth
EMAIL_FROM=
SECRET=                   # NextAuth secret
```

Docker Compose provides PostgreSQL locally on port 5432 with credentials `postgres:secrect` (note: intentional typo in original config).

## Known Issues

See `IMPROVEMENTS.md` for a full list. Critical ones to be aware of:

- `NEXT_PUBLIC_SIE` env var has a typo (affects QR code URL generation)
- `Category` model has no restaurant ownership — categories are globally shared across all users
- QR codes stored as large base64 in DB instead of object storage
- `useFormState` is deprecated; should use `useActionState`
- Server actions lack input validation (no Zod/schema validation)
