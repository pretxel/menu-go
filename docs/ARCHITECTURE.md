# Architecture Guide

This document describes the architecture of Menu-GO (Dineqrs), a QR-based digital menu management SaaS platform for restaurants.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router + Pages Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth.js (Google, Facebook, Credentials) |
| File Storage | Vercel Blob |
| AI | OpenAI GPT-4o (menu parsing), DALL-E 2 (category images) |
| Monorepo | Turborepo + PNPM workspaces |
| Analytics | Google Tag Manager, Vercel Analytics |

## Monorepo Structure

```
menu-go-frontend/
├── apps/
│   └── menu-go/                  # Main Next.js 15 application
│       └── src/
│           ├── app/              # App Router (panel, API, menu pages)
│           ├── pages/            # Pages Router (landing, login, learn, privacy)
│           ├── components/       # React components
│           ├── lib/              # Shared utilities (auth, prisma client)
│           ├── services/         # Client-side service calls
│           ├── styles/           # Global CSS
│           └── types/            # TypeScript type definitions
├── packages/
│   ├── db/                       # Prisma schema + client (shared database layer)
│   ├── ui/                       # Shared React UI components (bundled via Rollup)
│   ├── config/                   # Shared Next.js, ESLint, Jest configs
│   ├── tsconfig/                 # Shared TypeScript configs
│   └── tailwind-config/          # Shared Tailwind configuration
├── docker-compose.yml            # Local PostgreSQL + app containers
└── package.json                  # Root workspace scripts
```

The path alias `@/*` maps to `apps/menu-go/src/*`.

## Hybrid Routing

The app uses **both** Next.js routers simultaneously:

### Pages Router (`src/pages/`)

Handles public-facing, SEO-friendly pages with i18n support via `next-i18next`:

| Route | Page | Purpose |
|-------|------|---------|
| `/` | `pages/index.tsx` | Landing page |
| `/login` | `pages/login/index.tsx` | Authentication page |
| `/learn` | `pages/learn/index.tsx` | How-it-works tutorial |
| `/privacy` | `pages/privacy/index.tsx` | Privacy policy |

### App Router (`src/app/`)

Handles the authenticated panel, API routes, and public menu display:

| Route | Purpose |
|-------|---------|
| `/panel` | Restaurant configuration form (name, address, phone) |
| `/panel/dishes` | Dish management (list, create, edit, delete) |
| `/panel/categories` | Category management |
| `/panel/dishes/[categoryId]` | Dishes within a category |
| `/panel/dishes/[categoryId]/edit/[dishId]` | Edit a specific dish |
| `/menu/[restaurantId]` | Public menu by restaurant UUID (legacy) |
| `/menu/[slug]` | Public menu by human-readable slug |
| `/api/auth/[...nextauth]` | NextAuth.js authentication endpoints |
| `/api/upload` | Image upload to Vercel Blob |
| `/api/dishes/[dishId]` | Dish deletion endpoint |
| `/api/category/[categoryId]` | Category deletion endpoint |

## Authentication Flow

Authentication is handled by NextAuth.js, configured in `src/lib/auth.ts`.

### Providers

1. **Google OAuth** -- Standard OAuth 2.0 flow
2. **Facebook OAuth** -- Standard OAuth 2.0 flow
3. **Credentials** -- Demo mode that returns a hardcoded user (`jsmith@example.com`) for testing

### Session Enrichment

The session callback queries the database to enrich the session object:

```
Login -> NextAuth creates session -> Session callback fires
  -> Queries User + ConfigRestaurant from DB
  -> Adds user.id and user.configRestaurantId to session
  -> Client receives enriched session
```

- Adapter: `PrismaAdapter` stores users, accounts, and sessions in PostgreSQL
- Strategy: JWT with `next-auth.session-token` cookie
- After login, users are redirected to `/panel`
- Custom sign-in page at `/login`

### Middleware Route Protection

`src/middleware.ts` guards all `/panel` routes:

1. Checks for `next-auth.session-token` or `__Secure-next-auth.session-token` cookie
2. If no cookie is present, redirects to `/login`
3. If cookie is present, allows the request through

The middleware does **not** validate the JWT signature -- it only checks for cookie presence.

### Demo Mode (Unauthenticated Usage)

For users without a session, the app generates a temporary UUID stored in `localStorage` under the key `usedIdTemp`. This allows testing the panel flow without OAuth, though a `User` record is created in the database on first restaurant creation.

## Data Flow

### Server Actions (`src/app/actions.ts`)

All data mutations use React Server Actions rather than custom API routes:

```
Client Form -> useFormState(serverAction) -> Prisma -> PostgreSQL
                                          -> revalidatePath() to refresh UI
```

Server actions handle:
- Restaurant CRUD (create/update config, generate QR code and slug)
- Dish CRUD (create/update with category association)
- Category creation (with DALL-E 2 image generation)
- Menu retrieval (by ID or slug, with available dishes only)
- Menu photo parsing (GPT-4o vision) and bulk dish import
- Analytics tracking (menu views, QR scan counts)

### Data Read Pattern

Server components fetch data directly using server actions:

```
Server Component (e.g., panel/dishes/page.tsx)
  -> getServerSession(authOptions) to get user ID
  -> getDishes(userId) / getAllCategories() / getRestaurant(userId)
  -> Pass data as props to client components
```

## Database Schema

Managed via Prisma in `packages/db/prisma/schema.prisma`.

### Entity Relationships

```
User
  ├── Account[]           (OAuth accounts - Google, Facebook)
  ├── Session[]           (active sessions)
  └── ConfigRestaurant[]  (owned restaurants)
        ├── Dishes[]       (menu items)
        ├── Category[]     (restaurant-specific categories)
        └── MenuView[]     (page view analytics)

Category
  ├── Dishes[]            (dishes in this category)
  └── ConfigRestaurant?   (optional owner - null = global category)
```

### Key Models

- **User**: Auth user with optional password, email, OAuth accounts
- **ConfigRestaurant**: Restaurant profile with name, slug (unique, URL-friendly), address, phone, cuisineType, logoUrl, and qrCode (base64 data URL)
- **Dishes**: Menu items with name, price, description, tags (string array), isAvailable toggle, linked to a restaurant and category
- **Category**: Can be global (configRestaurantId = null) or restaurant-specific
- **MenuView**: Tracks page views with source ("direct" or "qr") and timestamp

## File Storage

### Dish Images

1. User selects an image in the `Uploader` component
2. Client sends the file to `POST /api/upload` (Edge runtime)
3. The API generates a random filename via `nanoid` and uploads to Vercel Blob
4. The returned blob URL is saved to the dish record via `updateDish()` server action

### Category Images

When a new category is created:
1. The category name is sent to DALL-E 2 to generate an image
2. The generated image is fetched and uploaded to Vercel Blob
3. The blob URL is stored in the category's `image` field

### QR Codes

Generated as base64 data URLs using the `qrcode` library and stored directly in the `ConfigRestaurant.qrCode` field. The QR encodes the menu URL: `{SITE_URL}/menu/{slug}`.

## AI Features

### Menu Photo Parsing (`parseMenuFromPhoto`)

Uses GPT-4o with vision to extract structured menu data from a photo:
- Input: base64-encoded image of a physical menu
- Output: JSON with categories, each containing dishes with name, description, price, and dietary tags
- Tags recognized: vegan, vegetarian, spicy, gluten-free, dairy-free

### Bulk Dish Import (`postBulkDishes`)

Takes the parsed menu data and creates categories + dishes in a single Prisma transaction:
- Creates restaurant-specific categories if they don't already exist
- Creates all dishes linked to the appropriate categories
- Runs inside `prisma.$transaction()` for atomicity

### Category Image Generation (`addCategory`)

Uses DALL-E 2 to generate a representative image for new categories based on the category name.

## Internationalization

- Library: `next-i18next`
- Config: `next-i18next.config.js`
- Translations: `public/locales/{locale}/*.json`
- Applied to Pages Router routes (landing, login, learn, privacy)
- The App Router panel is English-only

## Analytics

Two analytics systems are in use:

1. **Google Tag Manager** (`src/components/Analytics/`): Tracks page views via GTM, configured with `GTM_ID_GLOBAL`
2. **Vercel Analytics**: Integrated in the panel layout via `@vercel/analytics/react`
3. **Custom MenuView tracking**: Records each public menu page load with source attribution (direct link vs QR scan) in the `MenuView` database table
