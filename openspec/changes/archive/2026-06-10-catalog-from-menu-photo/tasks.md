# Tasks: catalog-from-menu-photo

## 1. Server-side foundation

- [x] 1.1 Add `resolveSiteUrl()` helper (`NEXT_PUBLIC_SITE_URL` → `https://${VERCEL_PROJECT_PRODUCTION_URL}` → `http://localhost:3000`) in `apps/menu-go/src/lib/` and use it in `postRestaurant` QR generation
- [x] 1.2 Add `publishCatalog` server action in `apps/menu-go/src/app/actions.ts`: zod schema (name required, address/phone optional, categories array), `requireSession()`, upsert restaurant (reuse slug+QR create path), bulk-import categories/dishes inside the same `$transaction`, return `{ slug, qrCode, menuUrl }`
- [x] 1.3 Make `publishCatalog` reuse an existing restaurant (no duplicate slug/QR; same-name categories reused) and add unit tests for: first-time publish, name-only publish, existing-restaurant publish, unauthenticated rejection

## 2. Funnel UI at /d

- [x] 2.1 Create `apps/menu-go/src/app/d/page.tsx` (public, no session redirect) rendering a new `CatalogFunnel` client component
- [x] 2.2 Build `CatalogFunnel` steps: photo (reuse `PhotoMenuImporter` upload/preview pieces) → extract → editable preview → details (name required, address/phone optional) → publish
- [x] 2.3 Sign-in gate on "Extract menu": if no session, persist funnel state and call `signIn(undefined, { callbackUrl: '/d' })`; also catch `UnauthorizedError`/auth failures from server actions and route through the same flow
- [x] 2.4 Funnel state persistence: save/restore `{ imageBase64, extractedCategories, step }` in `sessionStorage` (key `dineqrs:funnel`), 4MB image cap, quota-exceeded fallback (keep extraction JSON, ask to re-pick photo), clear on publish success

## 3. Success screen

- [x] 3.1 Success step in `CatalogFunnel`: QR image, `/r/<slug>` URL, copy-link button (clipboard + confirmation), download-QR button (data-URL anchor download), "Go to panel" link
- [x] 3.2 Verify `/r/<slug>` renders correctly with empty address/phone (nullable fields) and adjust the page if any field renders broken

## 4. Verification & polish

- [x] 4.1 Jest tests for funnel state persistence helper (save/restore/quota fallback) and `resolveSiteUrl()`
- [x] 4.2 Manual E2E pass: anonymous /d → photo → sign-in → state restored → extract → edit → publish → success screen → scan QR URL opens `/r/<slug>`; repeat as already-authed user with existing restaurant (automated via Playwright against prod build; Anthropic mocked via `ANTHROPIC_BASE_URL`, session via seeded DB session row — OAuth dance is the only unexercised step)
- [x] 4.3 `pnpm lint && pnpm test && pnpm build` clean; confirm `/d` links from landing and `/learn` work in a production build
