# Proposal: catalog-from-menu-photo

## Why

The landing page's primary CTA ("Create your free catalog" → `/d`) is a dead link, and the existing photo-import flow is buried behind sign-in + manual restaurant setup at `/panel/onboarding/dishes`. The product promise — "snap a photo, get a QR menu in 60 seconds" — has no actual end-to-end path. New users hit a 404 instead of the core value proposition.

## What Changes

- Add a public `/d` route: the catalog-creation funnel entry point linked from the landing page and `/learn`.
- Photo-first onboarding: user uploads a menu photo (or image file) **before** filling out restaurant details. AI extraction (`parseMenuFromPhoto`, already built) runs on the photo and shows an editable preview of categories/dishes.
- Minimal-friction publish: after extraction the user provides only a restaurant name (plus optional details), signs in if not authenticated (extraction state preserved), and publishes.
- Publish creates by default: restaurant config + slug, imported categories/dishes, the single public menu page at `/r/<slug>`, and a QR code linking to it — in one step instead of today's profile → categories → dishes sequence.
- Post-publish success screen: shows the QR code, the shareable `/r/<slug>` URL, download-QR and copy-link actions.
- Fix QR target: QR generation currently depends on `NEXT_PUBLIC_SITE_URL` which is unset in production (QR encodes a relative path). Resolve the base URL reliably.

## Capabilities

### New Capabilities

- `catalog-creation-funnel`: public `/d` entry, photo upload, AI extraction preview, edit-before-publish, auth handoff that preserves extraction state.
- `one-step-publish`: single action that creates restaurant + slug + categories + dishes + QR from funnel state; idempotent for users who already have a restaurant.
- `shareable-menu-page`: the default single public page (`/r/<slug>`) + QR as the canonical share artifact, with success screen (QR download, copy link).

### Modified Capabilities

<!-- none — no existing specs in openspec/specs/ -->

## Impact

- **Routes**: new `/d` (public, App Router); success screen under `/d` or `/panel`; existing `/r/[slug]` unchanged in rendering, becomes the publish target.
- **Server actions** (`apps/menu-go/src/app/actions.ts`): reuse `parseMenuFromPhoto`, `postBulkDishes`, `postRestaurant`; add a combined publish action (restaurant + bulk import + QR in one transaction-ish flow).
- **Components**: reuse/extend `PhotoMenuImporter`; new funnel page components.
- **Auth**: funnel is public until publish; publish requires session (NextAuth). Extraction state must survive the login redirect (sessionStorage or callback URL).
- **Env**: QR base-URL fix touches `NEXT_PUBLIC_SITE_URL` handling (`postRestaurant`); needs a production-safe fallback (e.g. `VERCEL_PROJECT_PRODUCTION_URL`).
- **Cost**: anonymous photo extraction calls Anthropic API — needs gating (auth-before-extract OR rate limit). Decision in design.md.
- **Landing page**: `/d` links start working; no copy changes required.
