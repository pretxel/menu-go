# Design: Digital Menu v2 — Completing DEFINITION.md

**Date:** 2026-04-04  
**Branch:** feature/digital-menu-v2  
**Status:** Approved

---

## Overview

Menu-GO (Dineqrs) is a QR-based digital menu SaaS for restaurants. A large portion of the app already exists. This spec covers the four remaining gaps between the current codebase and the requirements in `DEFINITION.md`.

---

## Scope

Four features, implemented in order:

1. **Claude API swap** — replace OpenAI with Anthropic SDK in photo import
2. **Editable preview** — inline name/price editing before bulk import
3. **Restaurant branding colors** — primary + background color per restaurant
4. **`/r/{slug}` public URL** — new canonical route, redirect from old `/menu/[slug]`

---

## Feature 1: Claude API (replacing OpenAI)

### What changes
- `apps/menu-go/src/app/actions.ts`: remove `openai` import, add `@anthropic-ai/sdk`
- `parseMenuFromPhoto` server action rewired to call `claude-sonnet-4-6` with the base64 image as a vision message
- Use Claude's structured output / tool_use to guarantee parseable JSON — no regex fallbacks

### Return shape (unchanged)
```ts
{
  categories: Array<{
    name: string;
    dishes: Array<{ name: string; description: string; price: number; tags: string[] }>;
  }>
}
```

### Environment
- Add `ANTHROPIC_API_KEY` to `.env` and `.env.example`
- Remove `OPENAI_API_KEY` from `.env.example` (no longer needed)

### No downstream changes
`PhotoMenuImporter` consumes the same return shape — zero changes required there for this step.

---

## Feature 2: Editable Preview

### What changes
- `apps/menu-go/src/components/PhotoMenuImporter/index.tsx` only

### Interaction
- After photo parse, each dish row renders two inline `<input>` fields: **name** (text, grows to fill space) and **price** (number, fixed-width, right-aligned)
- Inputs are pre-filled with parsed values
- Edits update the existing `categories` state via a helper: `updateDish(catIdx, dishIdx, field, value)`
- "Import all" already passes `categories` to `postBulkDishes` — edited values flow through with no further changes

### No new state
No modal, no separate edit step. Editing is inline in the existing preview list.

---

## Feature 3: Restaurant Branding Colors

### Schema change
Add to `ConfigRestaurant` in `packages/db/prisma/schema.prisma`:
```prisma
primaryColor    String?  @default("#4F46E5")
backgroundColor String?  @default("#FFFFFF")
```
- One migration, no data loss
- Existing restaurants inherit defaults

### Server action
- Extend `postRestaurantSchema` (Zod) with `primaryColor` and `backgroundColor` (optional strings)
- Pass them through to the Prisma `upsert` call in `postRestaurant`

### Admin UI
- Add two `<input type="color">` pickers to the restaurant config form
- Positioned alongside name/address/phone fields
- Labels: "Primary color" and "Background color"

### Public menu
- `Menu` component already receives the full restaurant object
- Apply colors as CSS custom properties on the root wrapper:
  ```tsx
  style={{
    '--color-primary': restaurant.primaryColor ?? '#4F46E5',
    '--color-bg': restaurant.backgroundColor ?? '#FFFFFF',
  } as React.CSSProperties}
  ```
- Category headers and accent elements reference `var(--color-primary)`
- Page background references `var(--color-bg)`

---

## Feature 4: `/r/{slug}` Public URL

### New route
- Create `apps/menu-go/src/app/r/[slug]/page.tsx`
- Identical logic to existing `/menu/[slug]/page.tsx`: calls `getMenuBySlug`, renders `<Menu>`, calls `trackMenuView`
- Reuse same metadata export

### Old route — permanent redirect
- Update `apps/menu-go/src/app/menu/[slug]/page.tsx` to call `permanentRedirect('/r/' + slug)` instead of rendering
- Keeps existing QR codes and bookmarks working

### QR code generation fix
- `postRestaurant` in `actions.ts` currently uses `NEXT_PUBLIC_SIE` (typo)
- Rename to `NEXT_PUBLIC_SITE` in `.env.example` and in the QR generation call
- QR target becomes `${process.env.NEXT_PUBLIC_SITE}/r/${slug}`
- Update `.env` locally to match

---

## Data Model Summary (after changes)

```prisma
model ConfigRestaurant {
  // existing fields ...
  primaryColor    String?  @default("#4F46E5")   // NEW
  backgroundColor String?  @default("#FFFFFF")   // NEW
}
```

No other schema changes.

---

## Testing

- **Feature 1:** Upload a menu photo in the panel — parsed categories/dishes should appear in preview. Check network tab for Anthropic API call.
- **Feature 2:** After parse, edit a dish name and price, import — verify saved values match edits.
- **Feature 3:** Set colors in restaurant config, visit `/r/{slug}` — verify page background and accent color match.
- **Feature 4:** Visit `/menu/{slug}` — verify 308 redirect to `/r/{slug}`. Visit `/r/{slug}` directly — menu loads. Generate new QR — URL should point to `/r/`.

---

## Out of Scope

- Full color theme (text, accent — only primary + background)
- Remove/add items in editable preview (name + price only)
- OAuth branding changes
- Analytics dashboard
