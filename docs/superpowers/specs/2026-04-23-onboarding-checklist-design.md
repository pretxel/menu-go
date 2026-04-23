# Design: Onboarding Progress Checklist

**Date:** 2026-04-23
**Status:** Approved

---

## Problem

Restaurant owners land on `/panel` after first login with no guidance on what to do next. The required setup sequence — configure profile → create category → add dishes → share QR — is not communicated anywhere. Photo import (the fastest way to add dishes) is buried inside `/panel/dishes`.

---

## Scope

Two deliverables, implemented together:

1. **Onboarding banner** — horizontal progress pills at the top of `/panel`
2. **Photo import hero page** — new `/panel/onboarding/dishes` route where photo import is the primary action

---

## Feature 1: Onboarding Banner

### Placement

Top of `/panel` page only, above the restaurant config form. Hidden on all other panel routes.

### Visual design

Indigo background strip (`#eef2ff`, border `#c7d2fe`) containing:
- "GET STARTED" label
- Four horizontal pills: **Profile → Category → Add dishes → Share QR**
- Dismiss "×" link (right-aligned)

Pill states:
- **Done**: green background (`#22c55e`), white text, checkmark prefix
- **Active** (current step — first incomplete): indigo background (`#4F46E5`), white text, arrow prefix, subtle box-shadow
- **Locked** (future): gray background (`#e5e7eb`), gray text, no link

Step completion rules:
| Pill | Done when |
|------|-----------|
| Profile | Always ✓ (can't reach /panel without it) |
| Category | User has ≥1 category linked to their restaurant |
| Add dishes | User has ≥1 dish linked to their restaurant |
| Share QR | Never turns green — no reliable completion signal. Always rendered as "active" once the three prior steps are done. Clicking scrolls to QR section. Banner hides only via dismiss or if user had already dismissed. |

### Pill links

| Pill | Link |
|------|------|
| Category | `/panel/categories` |
| Add dishes | `/panel/onboarding/dishes` |
| Share QR | `/panel#qr-section` |

Only active and done pills are clickable. Locked pills are non-interactive.

### Dismiss behavior

- "Dismiss ×" sets `localStorage.setItem('onboarding-dismissed', '1')`
- On mount, `OnboardingBanner` reads this flag and skips render
- Banner hides only on dismiss (no auto-hide — "Share QR" has no completion signal)
- Add `id="qr-section"` to the QR code wrapper in `/panel/page.tsx` so the anchor link works
- No permanent DB record for dismissal — localStorage only

### Completion data

New server action `getOnboardingStatus(userId)`:

```ts
// returns { hasCategory: boolean, hasDish: boolean }
const [catCount, dishCount] = await prisma.$transaction([
  prisma.category.count({ where: { configRestaurant: { userId } } }),
  prisma.dishes.count({ where: { configRestaurant: { userId } } }),
])
return { hasCategory: catCount > 0, hasDish: dishCount > 0 }
```

Called in `/panel/page.tsx` in parallel with `getRestaurant()`. Result passed as props to `OnboardingBanner`. No schema changes, no migrations.

---

## Feature 2: Photo Import Hero Page

### Route

`/panel/onboarding/dishes`

### States

**1. Upload prompt (initial)**
- Headline: "Add your dishes"
- Subtitle: "The fastest way: snap a photo of your paper menu. We'll read it for you."
- Large dashed upload zone (border `#a5b4fc`, background `#f5f3ff`) with camera emoji, label, file type hint, "Choose photo" button
- Divider ("or")
- "Add dishes manually →" link → `/panel/dishes`

**2. Parsing in progress**
- Same upload zone, replaced with spinner/progress bar
- Label: "Claude is extracting dishes from your photo"

**3. Editable preview**
- Reuses existing `PhotoMenuImporter` component (already has inline name/price editing)
- Headline: "Found N dishes in M categories"
- Subtitle: "Edit names and prices before importing."
- "Import all N dishes →" full-width button
- "← Try a different photo" link below button

**Post-import flow:**
- `postBulkDishes()` completes → `router.push('/panel/dishes')`
- Banner re-fetches on `/panel` — "Add dishes" pill turns green

### Guard

Page server component calls `getRestaurant(userId)`. If no restaurant configured, redirects to `/panel`.

---

## Files Changed

| Action | Path |
|--------|------|
| New | `src/components/OnboardingBanner/index.tsx` |
| New | `src/app/panel/onboarding/dishes/page.tsx` |
| Modified | `src/app/panel/page.tsx` |
| Modified | `src/app/actions.ts` |

---

## Out of Scope

- Empty state overhauls on `/panel/categories` and `/panel/dishes`
- "You're ready!" celebration screen
- Persistent DB-backed dismissal
- Showing banner on routes other than `/panel`
- Multi-restaurant support

---

## Testing

- First login: verify banner shows with only "Profile" green
- Create a category: verify "Category" pill turns green on next `/panel` visit
- Click "Add dishes" pill: verify lands on `/panel/onboarding/dishes`
- Upload menu photo: verify parsing, editable preview, import, redirect to `/panel/dishes`
- Click "Add manually": verify goes directly to `/panel/dishes`
- After ≥1 dish: verify "Add dishes" pill turns green
- Click "×": verify banner hides and stays hidden on refresh
- Complete profile + category + dishes: verify "Share QR" pill becomes active
- Click "Share QR": verify page scrolls to `#qr-section`
- Banner only hides via "×" dismiss, never auto-hides
