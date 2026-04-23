# Onboarding Checklist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a top-of-panel progress banner guiding new restaurant owners through setup (profile → category → dishes → share QR), with a photo-import hero page as the primary "add dishes" experience.

**Architecture:** A new `getOnboardingStatus` server action checks category/dish counts for the user's restaurant; the result is passed as props to a client-side `OnboardingBanner` that reads a localStorage dismiss flag. The "Add dishes" pill links to a new `/panel/onboarding/dishes` server page that renders a client `ImportHeroPage` wrapping the existing `PhotoMenuImporter` in always-open mode with a post-import redirect.

**Tech Stack:** Next.js 15 App Router (server components + client components), React, Tailwind CSS, Prisma, `next/navigation` (`useRouter`, `redirect`), `@testing-library/react`, Jest.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `apps/menu-go/src/app/actions.ts` | Add `getOnboardingStatus` server action |
| Create | `apps/menu-go/src/components/OnboardingBanner/index.tsx` | Progress banner (client component) |
| Modify | `apps/menu-go/src/app/panel/page.tsx` | Fetch onboarding status, render banner |
| Modify | `apps/menu-go/src/components/Forms/index.tsx` | Add `id="qr-section"` to QR div |
| Modify | `apps/menu-go/src/components/PhotoMenuImporter/index.tsx` | Add `alwaysOpen` + `onImportSuccess` props |
| Create | `apps/menu-go/src/components/PhotoMenuImporter/import-hero-page.tsx` | Client wrapper with router redirect |
| Create | `apps/menu-go/src/app/panel/onboarding/dishes/page.tsx` | Server page — guard + render hero |
| Modify | `apps/menu-go/__test__/actions.test.ts` | Tests for `getOnboardingStatus` |
| Create | `apps/menu-go/__test__/onboarding-banner.test.tsx` | Tests for `OnboardingBanner` |
| Modify | `apps/menu-go/__test__/photo-menu-importer.test.tsx` | Tests for new `alwaysOpen` + `onImportSuccess` props |
| Create | `apps/menu-go/__test__/import-hero-page.test.tsx` | Tests for `ImportHeroPage` |

---

## Task 1: `getOnboardingStatus` server action

**Files:**
- Modify: `apps/menu-go/src/app/actions.ts` (append at end of file)
- Modify: `apps/menu-go/__test__/actions.test.ts`

- [ ] **Step 1.1: Extend the prisma mock in `actions.test.ts` to include `category.count` and `dishes.count`**

Open `apps/menu-go/__test__/actions.test.ts`. Find the `jest.mock('../src/lib/prisma', ...)` block and replace it:

```ts
jest.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    configRestaurant: {
      findFirst: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    dishes: {
      count: jest.fn(),
    },
    menuView: {
      create: jest.fn(),
    },
  },
}));
```

- [ ] **Step 1.2: Add `getOnboardingStatus` to the import line in `actions.test.ts`**

Find:
```ts
import { getMenu, getMenuBySlug, getAllCategories, trackMenuView, parseMenuFromPhoto } from '../src/app/actions';
```

Replace with:
```ts
import { getMenu, getMenuBySlug, getAllCategories, trackMenuView, parseMenuFromPhoto, getOnboardingStatus } from '../src/app/actions';
```

- [ ] **Step 1.3: Write failing tests for `getOnboardingStatus` in `actions.test.ts`**

Append at the end of the file:

```ts
describe('getOnboardingStatus', () => {
  it('returns false/false when no restaurant found for user', async () => {
    mockPrisma.configRestaurant.findFirst.mockResolvedValue(null);

    const result = await getOnboardingStatus('user-no-restaurant');

    expect(result).toEqual({ hasCategory: false, hasDish: false });
  });

  it('returns hasCategory:false and hasDish:false when counts are 0', async () => {
    mockPrisma.configRestaurant.findFirst.mockResolvedValue({ id: 'rest-1' });
    mockPrisma.category.count.mockResolvedValue(0);
    mockPrisma.dishes.count.mockResolvedValue(0);

    const result = await getOnboardingStatus('user-1');

    expect(result).toEqual({ hasCategory: false, hasDish: false });
  });

  it('returns hasCategory:true when category count > 0', async () => {
    mockPrisma.configRestaurant.findFirst.mockResolvedValue({ id: 'rest-1' });
    mockPrisma.category.count.mockResolvedValue(2);
    mockPrisma.dishes.count.mockResolvedValue(0);

    const result = await getOnboardingStatus('user-1');

    expect(result).toEqual({ hasCategory: true, hasDish: false });
  });

  it('returns hasDish:true when dish count > 0', async () => {
    mockPrisma.configRestaurant.findFirst.mockResolvedValue({ id: 'rest-1' });
    mockPrisma.category.count.mockResolvedValue(1);
    mockPrisma.dishes.count.mockResolvedValue(5);

    const result = await getOnboardingStatus('user-1');

    expect(result).toEqual({ hasCategory: true, hasDish: true });
  });

  it('queries category count scoped to the restaurant', async () => {
    mockPrisma.configRestaurant.findFirst.mockResolvedValue({ id: 'rest-42' });
    mockPrisma.category.count.mockResolvedValue(0);
    mockPrisma.dishes.count.mockResolvedValue(0);

    await getOnboardingStatus('user-1');

    expect(mockPrisma.category.count).toHaveBeenCalledWith({
      where: { configRestaurantId: 'rest-42' },
    });
    expect(mockPrisma.dishes.count).toHaveBeenCalledWith({
      where: { configRestaurantId: 'rest-42' },
    });
  });
});
```

- [ ] **Step 1.4: Run tests to confirm they fail**

```bash
cd apps/menu-go && pnpm test -- --testPathPattern=actions.test
```

Expected: FAIL — `getOnboardingStatus is not a function`

- [ ] **Step 1.5: Implement `getOnboardingStatus` in `actions.ts`**

Append at the end of `apps/menu-go/src/app/actions.ts`:

```ts
export async function getOnboardingStatus(
  userId: string
): Promise<{ hasCategory: boolean; hasDish: boolean }> {
  const restaurant = await prisma.configRestaurant.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!restaurant) return { hasCategory: false, hasDish: false };

  const [catCount, dishCount] = await Promise.all([
    prisma.category.count({ where: { configRestaurantId: restaurant.id } }),
    prisma.dishes.count({ where: { configRestaurantId: restaurant.id } }),
  ]);

  return { hasCategory: catCount > 0, hasDish: dishCount > 0 };
}
```

- [ ] **Step 1.6: Run tests to confirm they pass**

```bash
cd apps/menu-go && pnpm test -- --testPathPattern=actions.test
```

Expected: All `getOnboardingStatus` tests PASS.

- [ ] **Step 1.7: Commit**

```bash
git add apps/menu-go/src/app/actions.ts apps/menu-go/__test__/actions.test.ts
git commit -m "feat: add getOnboardingStatus server action"
```

---

## Task 2: `OnboardingBanner` component

**Files:**
- Create: `apps/menu-go/src/components/OnboardingBanner/index.tsx`
- Create: `apps/menu-go/__test__/onboarding-banner.test.tsx`

- [ ] **Step 2.1: Write failing tests**

Create `apps/menu-go/__test__/onboarding-banner.test.tsx`:

```tsx
/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';

import OnboardingBanner from '../src/components/OnboardingBanner';

jest.mock('next/link', () => {
  return function MockLink({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

describe('OnboardingBanner', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders GET STARTED label', () => {
    render(<OnboardingBanner hasCategory={false} hasDish={false} />);
    expect(screen.getByText('GET STARTED')).toBeInTheDocument();
  });

  it('Profile pill is always shown as done', () => {
    render(<OnboardingBanner hasCategory={false} hasDish={false} />);
    expect(screen.getByText('✓ Profile')).toBeInTheDocument();
  });

  it('Add category pill is active (→) when hasCategory is false', () => {
    render(<OnboardingBanner hasCategory={false} hasDish={false} />);
    expect(screen.getByText('→ Add category')).toBeInTheDocument();
  });

  it('Add category pill is done (✓) when hasCategory is true', () => {
    render(<OnboardingBanner hasCategory={true} hasDish={false} />);
    expect(screen.getByText('✓ Add category')).toBeInTheDocument();
  });

  it('Add dishes pill is active when hasCategory is true and hasDish is false', () => {
    render(<OnboardingBanner hasCategory={true} hasDish={false} />);
    expect(screen.getByText('→ Add dishes')).toBeInTheDocument();
  });

  it('Add dishes pill is done when hasDish is true', () => {
    render(<OnboardingBanner hasCategory={true} hasDish={true} />);
    expect(screen.getByText('✓ Add dishes')).toBeInTheDocument();
  });

  it('Share QR pill is active when all other steps are done', () => {
    render(<OnboardingBanner hasCategory={true} hasDish={true} />);
    expect(screen.getByText('→ Share QR')).toBeInTheDocument();
  });

  it('Add dishes pill links to /panel/onboarding/dishes', () => {
    render(<OnboardingBanner hasCategory={true} hasDish={false} />);
    const link = screen.getByText('→ Add dishes').closest('a');
    expect(link).toHaveAttribute('href', '/panel/onboarding/dishes');
  });

  it('Dismiss button hides banner and sets localStorage flag', () => {
    render(<OnboardingBanner hasCategory={false} hasDish={false} />);
    fireEvent.click(screen.getByText('Dismiss ×'));
    expect(screen.queryByText('GET STARTED')).not.toBeInTheDocument();
    expect(localStorage.getItem('onboarding-dismissed')).toBe('1');
  });

  it('does not render when localStorage flag is set', () => {
    localStorage.setItem('onboarding-dismissed', '1');
    const { container } = render(<OnboardingBanner hasCategory={false} hasDish={false} />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2.2: Run tests to confirm they fail**

```bash
cd apps/menu-go && pnpm test -- --testPathPattern=onboarding-banner
```

Expected: FAIL — module not found.

- [ ] **Step 2.3: Implement `OnboardingBanner`**

Create `apps/menu-go/src/components/OnboardingBanner/index.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const DISMISS_KEY = 'onboarding-dismissed';

type Step = {
  label: string;
  done: boolean;
  href: string | null;
};

type Props = {
  hasCategory: boolean;
  hasDish: boolean;
};

export default function OnboardingBanner({ hasCategory, hasDish }: Props) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
  }, []);

  if (dismissed) return null;

  const steps: Step[] = [
    { label: 'Profile', done: true, href: null },
    { label: 'Add category', done: hasCategory, href: '/panel/categories' },
    { label: 'Add dishes', done: hasDish, href: '/panel/onboarding/dishes' },
    { label: 'Share QR', done: false, href: '#qr-section' },
  ];

  const activeIdx = steps.findIndex((s) => !s.done);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="bg-indigo-50 border-b-2 border-indigo-200 px-4 py-2.5 flex items-center gap-3 flex-wrap">
      <span className="text-xs font-bold text-indigo-600 whitespace-nowrap">GET STARTED</span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {steps.map((step, idx) => {
          const isActive = idx === activeIdx;
          const isLocked = !step.done && idx > activeIdx;
          const pillClass = [
            'px-3 py-1 rounded-full text-xs font-semibold',
            step.done ? 'bg-green-500 text-white' : '',
            isActive ? 'bg-indigo-600 text-white shadow' : '',
            isLocked ? 'bg-gray-200 text-gray-400' : '',
          ]
            .filter(Boolean)
            .join(' ');
          const pillText = step.done
            ? `✓ ${step.label}`
            : isActive
              ? `→ ${step.label}`
              : step.label;

          return (
            <span key={step.label} className="flex items-center gap-1.5">
              {idx > 0 && <span className="text-indigo-200 text-xs">›</span>}
              {step.href && !isLocked ? (
                <Link href={step.href} className={pillClass}>
                  {pillText}
                </Link>
              ) : (
                <span className={pillClass}>{pillText}</span>
              )}
            </span>
          );
        })}
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="ml-auto text-xs text-indigo-400 hover:text-indigo-600"
      >
        Dismiss ×
      </button>
    </div>
  );
}
```

- [ ] **Step 2.4: Run tests to confirm they pass**

```bash
cd apps/menu-go && pnpm test -- --testPathPattern=onboarding-banner
```

Expected: All tests PASS.

- [ ] **Step 2.5: Commit**

```bash
git add apps/menu-go/src/components/OnboardingBanner/index.tsx apps/menu-go/__test__/onboarding-banner.test.tsx
git commit -m "feat: add OnboardingBanner component"
```

---

## Task 3: Wire banner into `/panel` page + add QR anchor

**Files:**
- Modify: `apps/menu-go/src/app/panel/page.tsx`
- Modify: `apps/menu-go/src/components/Forms/index.tsx`

No new tests needed — these are wiring changes to existing components. Verify manually after.

- [ ] **Step 3.1: Update `panel/page.tsx` to fetch onboarding status and render banner**

Replace the entire file `apps/menu-go/src/app/panel/page.tsx` with:

```tsx
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import Form from '../../components/Forms';
import OnboardingBanner from '../../components/OnboardingBanner';
import { authOptions } from '../../lib/auth';
import { getOnboardingStatus } from '../actions';

export const metadata: Metadata = {
  title: 'Panel',
  description: 'main panel',
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;

  const { hasCategory, hasDish } = userId
    ? await getOnboardingStatus(userId)
    : { hasCategory: false, hasDish: false };

  return (
    <>
      <OnboardingBanner hasCategory={hasCategory} hasDish={hasDish} />
      <Form userId={userId} />
    </>
  );
}
```

- [ ] **Step 3.2: Add `id="qr-section"` to the QR div in `Forms/index.tsx`**

In `apps/menu-go/src/components/Forms/index.tsx`, find the second occurrence of:
```tsx
<div className="sm:col-span-3">
  <label
    htmlFor="menu"
    className="block text-sm font-medium leading-6 text-gray-900"
  >
    QR
  </label>
```

Replace with:
```tsx
<div id="qr-section" className="sm:col-span-3">
  <label
    htmlFor="menu"
    className="block text-sm font-medium leading-6 text-gray-900"
  >
    QR
  </label>
```

- [ ] **Step 3.3: Run the full test suite to confirm no regressions**

```bash
cd apps/menu-go && pnpm test
```

Expected: all existing tests pass.

- [ ] **Step 3.4: Commit**

```bash
git add apps/menu-go/src/app/panel/page.tsx apps/menu-go/src/components/Forms/index.tsx
git commit -m "feat: render OnboardingBanner on panel page, add qr-section anchor"
```

---

## Task 4: Extend `PhotoMenuImporter` with `alwaysOpen` + `onImportSuccess`

**Files:**
- Modify: `apps/menu-go/src/components/PhotoMenuImporter/index.tsx`
- Modify: `apps/menu-go/__test__/photo-menu-importer.test.tsx`

- [ ] **Step 4.1: Write failing tests for the new props**

In `apps/menu-go/__test__/photo-menu-importer.test.tsx`, append inside the existing `describe` block (before the closing `}`):

```tsx
  it('renders upload zone immediately when alwaysOpen is true (no toggle click needed)', () => {
    render(<PhotoMenuImporter userId="user-1" alwaysOpen />);
    expect(screen.queryByText('Import from photo')).not.toBeInTheDocument();
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
  });

  it('calls onImportSuccess after successful import instead of closing', async () => {
    const mockPostBulkDishes = postBulkDishes as jest.Mock;
    mockPostBulkDishes.mockResolvedValue(undefined);

    const onImportSuccess = jest.fn();

    render(
      <PhotoMenuImporter
        userId="user-1"
        initialCategories={parsedCategories}
        alwaysOpen
        onImportSuccess={onImportSuccess}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Import all'));
    });

    expect(onImportSuccess).toHaveBeenCalledTimes(1);
  });
```

- [ ] **Step 4.2: Run tests to confirm they fail**

```bash
cd apps/menu-go && pnpm test -- --testPathPattern=photo-menu-importer
```

Expected: 2 new tests FAIL (unknown props, wrong behavior).

- [ ] **Step 4.3: Update `PhotoMenuImporter` to accept and handle the new props**

Replace the `type PhotoMenuImporterProps` and the component signature in `apps/menu-go/src/components/PhotoMenuImporter/index.tsx`:

```tsx
type PhotoMenuImporterProps = {
  userId: string;
  initialCategories?: ParsedCategory[];
  alwaysOpen?: boolean;
  onImportSuccess?: () => void;
};

export default function PhotoMenuImporter({
  userId,
  initialCategories,
  alwaysOpen,
  onImportSuccess,
}: PhotoMenuImporterProps) {
  const [isOpen, setIsOpen] = useState(alwaysOpen ?? false);
```

Then find the `handleImportAll` function and replace the success block inside the `try`:

```tsx
      await postBulkDishes(userId, sanitized);
      setCategories(null);
      if (onImportSuccess) {
        onImportSuccess();
      } else {
        setIsOpen(false);
      }
```

Then find the early-return toggle button (the `if (!isOpen)` block) and wrap it to also check `alwaysOpen`:

```tsx
  if (!isOpen && !alwaysOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
      >
        Import from photo
      </button>
    );
  }
```

- [ ] **Step 4.4: Run tests to confirm they pass**

```bash
cd apps/menu-go && pnpm test -- --testPathPattern=photo-menu-importer
```

Expected: All tests (including the 3 original + 2 new) PASS.

- [ ] **Step 4.5: Commit**

```bash
git add apps/menu-go/src/components/PhotoMenuImporter/index.tsx apps/menu-go/__test__/photo-menu-importer.test.tsx
git commit -m "feat: add alwaysOpen and onImportSuccess props to PhotoMenuImporter"
```

---

## Task 5: `ImportHeroPage` client component

**Files:**
- Create: `apps/menu-go/src/components/PhotoMenuImporter/import-hero-page.tsx`
- Create: `apps/menu-go/__test__/import-hero-page.test.tsx`

- [ ] **Step 5.1: Write failing tests**

Create `apps/menu-go/__test__/import-hero-page.test.tsx`:

```tsx
/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import ImportHeroPage from '../src/components/PhotoMenuImporter/import-hero-page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('next/link', () => {
  return function MockLink({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

jest.mock('../src/app/actions', () => ({
  parseMenuFromPhoto: jest.fn(),
  postBulkDishes: jest.fn(),
}));

describe('ImportHeroPage', () => {
  it('renders the page heading', () => {
    render(<ImportHeroPage userId="user-1" />);
    expect(screen.getByText('Add your dishes')).toBeInTheDocument();
  });

  it('renders the subtitle about fastest way', () => {
    render(<ImportHeroPage userId="user-1" />);
    expect(screen.getByText(/fastest way/i)).toBeInTheDocument();
  });

  it('renders "Add dishes manually" link pointing to /panel/dishes', () => {
    render(<ImportHeroPage userId="user-1" />);
    const link = screen.getByText('Add dishes manually →').closest('a');
    expect(link).toHaveAttribute('href', '/panel/dishes');
  });

  it('does not render the "Import from photo" toggle button (alwaysOpen)', () => {
    render(<ImportHeroPage userId="user-1" />);
    expect(screen.queryByText('Import from photo')).not.toBeInTheDocument();
  });

  it('renders the upload zone directly', () => {
    render(<ImportHeroPage userId="user-1" />);
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 5.2: Run tests to confirm they fail**

```bash
cd apps/menu-go && pnpm test -- --testPathPattern=import-hero-page
```

Expected: FAIL — module not found.

- [ ] **Step 5.3: Implement `ImportHeroPage`**

Create `apps/menu-go/src/components/PhotoMenuImporter/import-hero-page.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import PhotoMenuImporter from './index';

type Props = {
  userId: string;
};

export default function ImportHeroPage({ userId }: Props) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Add your dishes</h1>
      <p className="text-sm text-gray-500 mb-8">
        The fastest way: snap a photo of your paper menu. We&apos;ll read it for you.
      </p>
      <PhotoMenuImporter
        userId={userId}
        alwaysOpen
        onImportSuccess={() => router.push('/panel/dishes')}
      />
      <div className="mt-6 text-center">
        <Link
          href="/panel/dishes"
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          Add dishes manually →
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 5.4: Run tests to confirm they pass**

```bash
cd apps/menu-go && pnpm test -- --testPathPattern=import-hero-page
```

Expected: All tests PASS.

- [ ] **Step 5.5: Commit**

```bash
git add apps/menu-go/src/components/PhotoMenuImporter/import-hero-page.tsx apps/menu-go/__test__/import-hero-page.test.tsx
git commit -m "feat: add ImportHeroPage client component for photo-first dish onboarding"
```

---

## Task 6: Hero page server component

**Files:**
- Create: `apps/menu-go/src/app/panel/onboarding/dishes/page.tsx`

No unit test for this page — it's a thin server component (session guard + redirect + render). Verify manually.

- [ ] **Step 6.1: Create the directory and server page**

Create `apps/menu-go/src/app/panel/onboarding/dishes/page.tsx`:

```tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import ImportHeroPage from '../../../../components/PhotoMenuImporter/import-hero-page';
import { authOptions } from '../../../../lib/auth';
import { getRestaurant } from '../../../actions';

export default async function Page() {
  const session = await getServerSession(authOptions);
  const restaurant = await getRestaurant(session?.user.id);

  if (!restaurant) redirect('/panel');

  return <ImportHeroPage userId={session!.user.id} />;
}
```

- [ ] **Step 6.2: Run the full test suite to confirm no regressions**

```bash
cd apps/menu-go && pnpm test
```

Expected: All tests pass.

- [ ] **Step 6.3: Commit**

```bash
git add apps/menu-go/src/app/panel/onboarding/dishes/page.tsx
git commit -m "feat: add /panel/onboarding/dishes hero page for photo import"
```

---

## Manual Verification Checklist

Start the dev server (`pnpm dev`) and walk through this flow:

- [ ] Log in → visit `/panel` → banner appears with "→ Add category" as the active step
- [ ] Click "Add category" pill → lands on `/panel/categories`
- [ ] Create a category → return to `/panel` → "Add category" pill turns green, "→ Add dishes" becomes active
- [ ] Click "Add dishes" pill → lands on `/panel/onboarding/dishes`
- [ ] Upload a menu photo → parsing spinner shows → editable preview appears
- [ ] Edit a dish name/price → click "Import all" → redirects to `/panel/dishes`, dishes are saved
- [ ] Return to `/panel` → "Add dishes" pill turns green, "→ Share QR" becomes active
- [ ] Click "Share QR" → page scrolls to `#qr-section`
- [ ] Click "Add dishes manually →" on hero page → goes directly to `/panel/dishes`
- [ ] Click "Dismiss ×" on banner → banner hides, stays hidden on refresh
