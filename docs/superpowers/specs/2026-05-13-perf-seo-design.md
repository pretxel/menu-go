# Perf + SEO Bundle — Design

**Date:** 2026-05-13
**Scope:** `apps/menu-go` — public-facing pages, sitemap, image rendering, route caching
**Status:** Approved (pending review)

## Problem

The customer-facing menu page `/r/[slug]` is the SEO surface area of the product, but:
- Root layout has only `title: 'Dineqrs'`, `description: '...'`; no `metadataBase`, no Open Graph, no Twitter card, no template, no `icons`.
- `/r/[slug]` ships every restaurant with the literal metadata `title: 'Menu', description: 'Menu'`. Identical for all tenants. No canonical, no per-restaurant OG.
- `sitemap.ts` is hardcoded to three marketing URLs (`/`, `/learn`, `/privacy`). The hundreds of `/r/[slug]` pages are not indexed.
- No JSON-LD. Search engines can't extract restaurant or menu data.

Perf issues:
- Nine components use raw `<img>` (`Uploader`, `Landing`, `Forms/index`, `Dishes/index`, `Learn`, `Panel/Nav`, `Dishes/dialog-dish`, `Login`, `Menu/dish`). Vercel Blob serves images, but the browser gets unoptimized originals.
- No `next.config.js` `remotePatterns` configured for the Blob domain, so `next/image` would refuse to optimize Blob URLs even if used.
- The `/r/[slug]` and `/menu/[slug]` pages have no `revalidate` or caching directives. Every QR scan triggers a fresh DB fetch + render.
- `trackMenuView` is awaited in `/r/[slug]/page.tsx`, blocking response while the analytics row inserts.

## Goals

1. Every public route ships per-route metadata with at least title, description, canonical, Open Graph image, Twitter card.
2. `/r/[slug]` emits JSON-LD `Restaurant` + nested `Menu` so search engines can extract structured menu data.
3. `sitemap.ts` dynamically lists every active restaurant by slug, with `lastModified` from `updatedAt`.
4. Every `<img>` in the codebase becomes `<Image>` from `next/image`, with widths/heights, `priority` on LCP images, and `sizes` for responsive variants.
5. Public-facing pages (`/r/[slug]`, `/menu/[slug]`) are cached with `revalidate` so cold cache only on update or window expiry.
6. `trackMenuView` does not delay render — fired post-response.

## Non-Goals

- Bundle size analysis or dependency replacement (react-share, etc.) — separate bundle.
- Core Web Vitals tuning beyond what `next/image` + caching deliver naturally.
- New marketing pages, landing redesign, A/B infrastructure.
- Migrating QR code from base64 data URL to Blob storage (separate bundle, also mentioned in the auth-boundary spec as out of scope).
- Schema.org Organization, Article, Product schemas.

## Architecture

### SEO foundations

**Constants module.** New file `apps/menu-go/src/lib/site.ts`:

```ts
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dineqrs.com';
export const SITE_NAME = 'Dineqrs';
export const SITE_DESCRIPTION = 'QR menus that actually look like something.';
```

**Root layout.** `apps/menu-go/src/app/layout.tsx` exports:

```ts
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  icons: { icon: '/favicon.ico' },
};
```

**Per-restaurant metadata.** `/r/[slug]/page.tsx` adds:

```ts
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await prisma.configRestaurant.findFirst({
    where: { slug },
    select: { name: true, address: true, cuisineType: true, logoUrl: true, slug: true, id: true },
  });
  if (!restaurant) return { title: 'Menu not found' };

  const title = restaurant.name ?? 'Menu';
  const description = restaurant.cuisineType
    ? `${title} — ${restaurant.cuisineType} menu`
    : `${title} menu`;
  const canonical = `${SITE_URL}/r/${restaurant.slug ?? restaurant.id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      title,
      description,
      url: canonical,
      images: restaurant.logoUrl ? [{ url: restaurant.logoUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: restaurant.logoUrl ? [restaurant.logoUrl] : undefined,
    },
  };
}
```

The metadata read is a separate Prisma query (cheaper `select`) from the page's `getMenuBySlug`. Both resolve on the server — fine; Next dedupes when wrapped in `cache()` if needed. Not adding `cache()` yet — measure first.

### JSON-LD

A small client-side component `apps/menu-go/src/components/Menu/json-ld.tsx`:

```tsx
import type { ConfigRestaurant, Category, Dishes } from 'db';

type Props = {
  restaurant: Pick<ConfigRestaurant, 'name' | 'address' | 'phone' | 'cuisineType' | 'slug' | 'id'>;
  dishes: Array<Dishes & { category: Category }>;
  url: string;
};

export default function MenuJsonLd({ restaurant, dishes, url }: Props) {
  const sections = Object.entries(
    dishes.reduce<Record<string, typeof dishes>>((acc, d) => {
      const key = d.category.name;
      (acc[key] ||= []).push(d);
      return acc;
    }, {}),
  ).map(([name, items]) => ({
    '@type': 'MenuSection',
    name,
    hasMenuItem: items.map((d) => ({
      '@type': 'MenuItem',
      name: d.name,
      description: d.description ?? undefined,
      offers: { '@type': 'Offer', price: d.price, priceCurrency: 'USD' },
    })),
  }));

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurant.name,
    address: restaurant.address ?? undefined,
    telephone: restaurant.phone ?? undefined,
    servesCuisine: restaurant.cuisineType ?? undefined,
    url,
    hasMenu: { '@type': 'Menu', hasMenuSection: sections },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

Rendered as a sibling of `<Menu>` inside `/r/[slug]/page.tsx`. Currency hard-coded to USD for v1 — multi-currency is a separate concern.

### Dynamic sitemap

`apps/menu-go/src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next';
import prisma from '../lib/prisma';
import { SITE_URL } from '../lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const restaurants = await prisma.configRestaurant.findMany({
    where: { slug: { not: null } },
    select: { slug: true, updatedAt: true },
  });

  const restaurantRoutes: MetadataRoute.Sitemap = restaurants.map((r) => ({
    url: `${SITE_URL}/r/${r.slug}`,
    lastModified: r.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: 'yearly', priority: 1 },
    { url: `${SITE_URL}/learn`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    ...restaurantRoutes,
  ];
}
```

Sitemap re-runs on every request unless cached. For now accept that — sitemap traffic is from crawlers, not customers. If volume grows, add `revalidate`.

### Image migration

**Config.** `apps/menu-go/next.config.js` gets:

```js
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    { protocol: 'https', hostname: '*.blob.vercel-storage.com' },
  ],
},
```

**Per file.** Replace `<img>` with:

```tsx
import Image from 'next/image';

<Image src={url} alt={alt} width={W} height={H} sizes="..." priority={isLcp} />
```

LCP images (banner, hero on `/`, dish images above the fold) get `priority`. Decorative or below-fold images use default (lazy + auto). Width/height inferred from existing markup or set conservatively (e.g., dish thumbnails 320×240). The `eslint-disable @next/next/no-img-element` directives are removed.

The QR code is currently a base64 data URL — `next/image` accepts data URLs but cannot optimize them. Leave it as an `<img>` with the eslint-disable retained (or migrate to Blob storage in a separate bundle). Note this exception in code.

### Caching + RSC

**`/r/[slug]/page.tsx`:**

```ts
export const revalidate = 60; // ISR every minute
```

A restaurant typically edits a dish, sees the change quickly. 60s is the floor that balances freshness and cache hit. Revalidation can be wired to dish/restaurant mutations later via `revalidatePath('/r/' + slug)` in actions — out of scope for this bundle.

**`/menu/[slug]/page.tsx`:** same treatment if the file exists.

**`trackMenuView` detached.** Use Next 16's `after()` from `next/server`:

```ts
import { after } from 'next/server';
// ...
after(() => trackMenuView(restaurant.id, src === 'qr' ? 'qr' : 'direct'));
```

`after()` queues work to run after the response is flushed. If `after` isn't available, fall back to fire-and-forget:

```ts
void trackMenuView(restaurant.id, src === 'qr' ? 'qr' : 'direct').catch(() => {});
```

The catch is already in place; just drop the `await` and stop blocking render.

**RSC audit.** No `'use client'` should appear on the page or its server-only children. `Menu/index.tsx` is a server component today — keep it that way. Only convert leaves that need event handlers.

## Testing

- `apps/menu-go/__test__/sitemap.test.ts` — mock prisma, assert returned sitemap includes restaurant entries.
- `apps/menu-go/__test__/r-slug-metadata.test.ts` — mock prisma, call `generateMetadata`, assert title/canonical shape.
- `apps/menu-go/__test__/json-ld.test.tsx` — render the JSON-LD component, parse the script tag content, assert schema structure.
- No new e2e infra.
- Manual smoke: view-source on a `/r/[slug]` page, confirm metadata + JSON-LD present.

## Migration / Rollout

- No DB migration.
- Pure code change, single PR.
- Cache-related: existing menu pages will start being cached for up to 60s — acceptable (restaurants update menus infrequently). Document in PR.
- After merge, run Lighthouse against a representative `/r/[slug]` page to confirm improvements.

## Open Questions

None at time of writing. Currency defaulting to USD on JSON-LD is a known v1 simplification; can be derived from a `currency` column on `ConfigRestaurant` in a follow-up.
