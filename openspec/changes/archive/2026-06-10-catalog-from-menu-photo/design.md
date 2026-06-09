# Design: catalog-from-menu-photo

## Context

The building blocks exist but are disconnected:

- `parseMenuFromPhoto()` (`apps/menu-go/src/app/actions.ts`) — Claude vision extraction returning `{ categories: [{ name, dishes: [...] }] }`. Requires a session.
- `postBulkDishes()` — imports extracted categories/dishes. Requires a session **and** an existing `ConfigRestaurant`.
- `postRestaurant()` — creates restaurant + slug + QR (QR points to `/r/<slug>`).
- `PhotoMenuImporter` component — upload, drag-drop, extraction preview with inline edit, bulk import. Mounted only at `/panel/onboarding/dishes` (authed, restaurant required).
- `/r/[slug]` — public single-page menu. Already the QR target.
- Landing + `/learn` link to `/d`, which does not exist (404).

Constraints: NextAuth (JWT cookie) with Google/credentials; Pages Router for public pages, App Router for panel/api; Anthropic API calls cost money and must not be callable anonymously; `NEXT_PUBLIC_SITE_URL` is not set in production so QR currently encodes a relative URL.

## Goals / Non-Goals

**Goals:**
- Working `/d` funnel: photo → extraction preview → minimal details → publish → QR + share link.
- One publish action that creates everything (restaurant, categories, dishes, QR) by default.
- Survive the sign-in redirect without losing the user's photo/extraction work.
- Production-correct QR URLs.

**Non-Goals:**
- Multi-page menus, theming, or layout options for `/r/<slug>` (single page is the default and only output).
- Anonymous (no-account) publishing — an account is still required to own a catalog.
- PDF menu parsing, multi-photo stitching, OCR fallback.
- Billing/quota system (a simple per-user guard is enough for now).

## Decisions

### D1: Funnel route is `/d` in the App Router, public
Landing already links to `/d`; keep it. App Router (`src/app/d/page.tsx`) because the funnel reuses App Router server actions and client components (`PhotoMenuImporter`). The proxy (`src/proxy.ts`) only guards `/panel`, so `/d` is public by default — no change needed there.
*Alternative considered*: redirect `/d` → `/panel/onboarding/dishes`. Rejected: forces login + restaurant profile before showing any value, which is the exact friction this change removes.

### D2: Photo selection is anonymous; AI extraction requires a session
The user can pick/drop a photo and see it locally without an account. Pressing "Extract menu" when unauthenticated triggers sign-in (`signIn(undefined, { callbackUrl: '/d' })`). Extraction (`parseMenuFromPhoto`) keeps its `requireSession()` guard so Anthropic spend is never anonymous.
*Alternative considered*: anonymous extraction with IP rate limiting. Rejected: needs durable rate-limit storage (KV/Upstash), still abusable, and sign-in-before-spend is the norm for free tiers.

### D3: Funnel state survives auth redirect via `sessionStorage`
Before redirecting to sign-in, persist `{ imageBase64, extractedCategories?, step }` to `sessionStorage` (key `dineqrs:funnel`). On `/d` mount, rehydrate and resume at the saved step. Cap stored image at ~4MB base64; if `setItem` throws (quota), drop the image, keep extracted JSON if present, and show "re-select your photo". OAuth round-trips return to the same tab, so `sessionStorage` is sufficient.
*Alternative considered*: upload photo to Vercel Blob pre-auth and pass a blob URL through the callback. Rejected: anonymous writes to Blob are an abuse vector and add cleanup work.

### D4: New `publishCatalog` server action (one-step publish)
A single action composing existing logic instead of the client orchestrating three actions:

```
publishCatalog(input: { restaurant: { name, address?, phone? }, categories: ParsedCategory[] })
  1. requireSession()
  2. upsert ConfigRestaurant (reuse postRestaurant's create path: slug + QR)
  3. bulk-create categories + dishes (reuse postBulkDishes logic, same transaction)
  4. return { slug, qrCode, menuUrl }
```

Idempotent-ish: if the user already has a restaurant, reuse it (no duplicate) and just import dishes. Address/phone become optional in this path — placeholder empty strings if missing — so the funnel only *requires* a name. `postRestaurant`'s standalone validation stays strict; relaxation lives in `publishCatalog` only.
*Alternative considered*: client calls `postRestaurant` then `postBulkDishes`. Rejected: two failure points, partial states (restaurant without dishes) and double round-trips.

### D5: QR base URL resolution helper
`resolveSiteUrl()`: `NEXT_PUBLIC_SITE_URL` → `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` → `http://localhost:3000`. Used by `publishCatalog` and `postRestaurant`. Fixes QR codes encoding relative paths in production.

### D6: Success screen lives in the funnel (`/d` final step), not a new route
After publish, the funnel swaps to a success view: QR image (`<img src={qrCode}>` data-URL), `/r/<slug>` link, copy-link button, download-QR button (anchor download of the data URL), and a "Go to panel" link. No extra route, no extra auth handling, state is already in hand.

## Risks / Trade-offs

- [Base64 photo > sessionStorage quota] → 4MB cap + graceful degradation (keep extraction JSON, ask to re-pick photo only if extraction hadn't run).
- [User already has restaurant + dishes and lands on /d] → `publishCatalog` imports into the existing restaurant; success screen shows existing slug/QR. Duplicate dishes possible if re-run — acceptable; dishes are editable/deletable in panel.
- [Anthropic extraction failure/garbage output] → existing preview/edit step is the safety net; user can correct before publish. Keep current error message path.
- [Authed user with session cookie but expired JWT presses Extract] → server action throws `UnauthorizedError`; client catches and routes through the same sign-in flow as unauthenticated users.
- [Relaxing address/phone to optional] → `/r/<slug>` already renders with null address/phone (fields are nullable in Prisma); panel settings prompt completion later.

## Migration Plan

Pure addition — no schema changes, no data migration. Deploy in one release. Rollback = revert; `/d` returns to 404 with no data impact.

## Open Questions

- None blocking. Per-user extraction quota (e.g. N extractions/day) deferred until abuse is observed.
