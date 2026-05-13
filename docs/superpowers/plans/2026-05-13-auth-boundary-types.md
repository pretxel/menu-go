# Auth Boundary + Types Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop trusting form-supplied `userId` in server actions. Read identity from NextAuth session, enforce ownership on writes, kill the `/d/*` demo path, drop `any` types across the affected surface.

**Architecture:** Introduce a thin `authedAction(schema, handler)` wrapper in `apps/menu-go/src/lib/server-action.ts` that injects the session and parses input with Zod. All mutating actions migrate to it. Authed reads call a `requireSession()` helper. Public reads (`getMenu`, `getMenuBySlug`, `trackMenuView`) keep current signatures. The `/d/*` route tree and every `localStorage.usedIdTemp` read are deleted.

**Tech Stack:** Next.js 15 App Router, NextAuth.js (Prisma adapter), Prisma 5, Zod, Jest + ts-jest, React 19, TypeScript 5.

**Spec:** `docs/superpowers/specs/2026-05-13-auth-boundary-types-design.md`

---

## File Map

**Create:**
- `apps/menu-go/src/lib/server-action.ts` — `authedAction`, `requireSession`, `UnauthorizedError`, `ActionState<T>` type
- `apps/menu-go/__test__/server-action.test.ts` — unit tests for the wrapper

**Modify:**
- `apps/menu-go/src/types/next-auth.d.ts` — broaden `Session.user` type
- `apps/menu-go/src/types/dish.ts` — replace `any` with `Category` type
- `apps/menu-go/src/lib/auth.ts` — replace `@ts-ignore` blocks with `envOrThrow` helper
- `apps/menu-go/src/app/actions.ts` — wrap actions, ownership checks, drop `any`, top-level `openai` import, schema for `addCategory`
- `apps/menu-go/src/components/Forms/index.tsx` — remove `userId` prop + localStorage, render field errors, handle `requiresAuth`
- `apps/menu-go/src/components/Forms/dishesForm.tsx` — same removal pattern, type `category`
- `apps/menu-go/src/components/List/dishes.tsx` — remove localStorage fallback
- `apps/menu-go/src/components/Dishes/qr-button.tsx` — remove localStorage fallback
- `apps/menu-go/src/app/panel/page.tsx` — stop threading `userId` to `Form`
- `apps/menu-go/__test__/actions.test.ts` — update for session-based identity and new return shape
- `apps/menu-go/__test__/dish-form.test.tsx` — drop `userId` prop expectation

**Delete:**
- `apps/menu-go/src/app/d/` (entire directory tree)
- `apps/menu-go/src/components/Menu/user-no-auth.tsx`
- `referalId` link target in `UserNoAuth` (gone with the file)

---

## Task 1: Add `ActionState` + `authedAction` wrapper

**Files:**
- Create: `apps/menu-go/src/lib/server-action.ts`
- Test: `apps/menu-go/__test__/server-action.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/menu-go/__test__/server-action.test.ts`:

```ts
import { z } from 'zod';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../src/lib/auth', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { authedAction } from '../src/lib/server-action';

const schema = z.object({ name: z.string().min(1) });

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

describe('authedAction', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns requiresAuth when no session', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const action = authedAction(schema, async () => ({ message: 'ok' }));
    const res = await action({ message: null }, fd({ name: 'x' }));
    expect(res.requiresAuth).toBe(true);
    expect(res.message).toBe('Sign in required.');
  });

  it('returns fieldErrors on schema failure', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } });
    const action = authedAction(schema, async () => ({ message: 'ok' }));
    const res = await action({ message: null }, fd({ name: '' }));
    expect(res.fieldErrors?.name?.length).toBeGreaterThan(0);
    expect(res.message).toBeNull();
  });

  it('calls handler with parsed input and session on happy path', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } });
    const handler = jest.fn(async () => ({ message: 'created' }));
    const action = authedAction(schema, handler);
    const res = await action({ message: null }, fd({ name: 'dish' }));
    expect(handler).toHaveBeenCalledWith({
      session: { user: { id: 'u1' } },
      input: { name: 'dish' },
    });
    expect(res.message).toBe('created');
  });

  it('returns generic error on unexpected throw', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } });
    const action = authedAction(schema, async () => { throw new Error('boom'); });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await action({ message: null }, fd({ name: 'dish' }));
    expect(res.message).toBe('Something went wrong.');
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `cd apps/menu-go && pnpm test -- --testPathPattern=server-action`
Expected: FAIL — module `../src/lib/server-action` not found.

- [ ] **Step 3: Implement the wrapper**

Create `apps/menu-go/src/lib/server-action.ts`:

```ts
import { getServerSession } from 'next-auth';
import { z, ZodSchema } from 'zod';

import { authOptions } from './auth';

export type ActionState<T = void> = {
  message: string | null;
  data?: T;
  fieldErrors?: Record<string, string[]>;
  requiresAuth?: boolean;
};

export class UnauthorizedError extends Error {
  constructor(message = 'Not signed in') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export type AuthedSession = { user: { id: string; email?: string | null } };

export async function requireSession(): Promise<AuthedSession> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new UnauthorizedError();
  return session as AuthedSession;
}

type Handler<S extends ZodSchema, R> = (args: {
  session: AuthedSession;
  input: z.infer<S>;
}) => Promise<ActionState<R>>;

export function authedAction<S extends ZodSchema, R = void>(
  schema: S,
  handler: Handler<S, R>,
) {
  return async (
    _prev: ActionState<R>,
    formData: FormData,
  ): Promise<ActionState<R>> => {
    try {
      const session = await requireSession();
      const raw = Object.fromEntries(formData.entries());
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        return {
          message: null,
          fieldErrors: parsed.error.flatten().fieldErrors,
        };
      }
      return handler({ session, input: parsed.data });
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        return { message: 'Sign in required.', requiresAuth: true };
      }
      console.error(e);
      return { message: 'Something went wrong.' };
    }
  };
}
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `cd apps/menu-go && pnpm test -- --testPathPattern=server-action`
Expected: PASS, 4 tests.

The existing `__test__/actions.test.ts` mocks `zod` globally — if that mock leaks into this test file, override at the top of `server-action.test.ts`:

```ts
jest.unmock('zod');
```

- [ ] **Step 5: Commit**

```bash
git add apps/menu-go/src/lib/server-action.ts apps/menu-go/__test__/server-action.test.ts
git commit -m "feat(actions): add authedAction wrapper with session + Zod"
```

---

## Task 2: Augment NextAuth `Session.user` type

**Files:**
- Modify: `apps/menu-go/src/types/next-auth.d.ts`

- [ ] **Step 1: Replace contents**

```ts
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      configRestaurantId?: string | null;
    } & DefaultSession['user'];
  }
}
```

The existing file already has this shape; only ensure `id: string` (non-optional) and that `DefaultSession` is imported. If already correct, skip the change but verify.

- [ ] **Step 2: Type-check**

Run: `cd apps/menu-go && pnpm tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit (only if changed)**

```bash
git add apps/menu-go/src/types/next-auth.d.ts
git commit -m "chore(types): tighten next-auth Session.user.id to required"
```

If unchanged, skip commit.

---

## Task 3: Replace `@ts-ignore` in `auth.ts` with `envOrThrow`

**Files:**
- Modify: `apps/menu-go/src/lib/auth.ts`

- [ ] **Step 1: Edit `auth.ts`**

Add at top, after imports:

```ts
function envOrThrow(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}
```

Replace the three `// @ts-ignore` provider configs:

```ts
FacebookProvider({
  clientId: envOrThrow('FACEBOOK_CLIENT_ID'),
  clientSecret: envOrThrow('FACEBOOK_CLIENT_SECRET'),
}),
GoogleProvider({
  clientId: envOrThrow('GOOGLE_CLIENT_ID'),
  clientSecret: envOrThrow('GOOGLE_CLIENT_SECRET'),
}),
```

Leave the `CredentialsProvider` block alone.

- [ ] **Step 2: Type-check**

Run: `cd apps/menu-go && pnpm tsc --noEmit`
Expected: PASS, no `@ts-ignore` lint warnings on those lines.

- [ ] **Step 3: Commit**

```bash
git add apps/menu-go/src/lib/auth.ts
git commit -m "refactor(auth): replace ts-ignore with envOrThrow helper"
```

---

## Task 4: Type `IDish.category` and `IDishesForm.category`

**Files:**
- Modify: `apps/menu-go/src/types/dish.ts`

- [ ] **Step 1: Edit `types/dish.ts`**

```ts
import type { Category } from '../../../../packages/db/generated/prisma';

export type IDish = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: Pick<Category, 'id' | 'name' | 'description'> | null;
  categoryId: string;
};
```

If the Prisma import path differs, use whatever path the rest of the app uses for Prisma types (search: `grep -rn "from 'db'" apps/menu-go/src`). The simplest portable variant is to redeclare locally:

```ts
export type CategoryLite = { id: string; name: string; description: string };
export type IDish = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: CategoryLite | null;
  categoryId: string;
};
```

Use `CategoryLite` if the Prisma type import is awkward.

- [ ] **Step 2: Type-check**

Run: `cd apps/menu-go && pnpm tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/menu-go/src/types/dish.ts
git commit -m "refactor(types): drop any from IDish.category"
```

---

## Task 5: Migrate `postDish` to `authedAction` with ownership check

**Files:**
- Modify: `apps/menu-go/src/app/actions.ts`

- [ ] **Step 1: Update schema (drop `userId`, keep rest)**

Replace `postDishSchema`:

```ts
const postDishSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Price must be a valid non-negative number'),
  categoryId: z.string().min(1, 'Category is required'),
  dishId: z.string().optional().default(''),
  description: z.string().optional().default(''),
  tags: z.string().optional().default(''),
  isAvailable: z.string().optional().default('true'),
});
```

- [ ] **Step 2: Replace `postDish` body**

```ts
import { authedAction, type ActionState } from '../lib/server-action';

export const postDish = authedAction(postDishSchema, async ({ session, input }) => {
  const userId = session.user.id;
  const { name, price, categoryId, dishId, description } = input;
  const isAvailable = input.isAvailable !== 'false';
  const tags = input.tags ? input.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  const existConfig = await prisma.configRestaurant.findFirst({ where: { userId } });
  if (!existConfig) {
    return { message: 'Create your restaurant profile first.' } as ActionState;
  }

  if (!dishId) {
    await prisma.dishes.create({
      data: {
        name,
        categoryId,
        configRestaurantId: existConfig.id,
        description: description || '',
        price: parseFloat(price),
        tags,
        isAvailable,
      },
    });
  } else {
    const existing = await prisma.dishes.findFirst({
      where: { id: dishId, configRestaurantId: existConfig.id },
    });
    if (!existing) {
      return { message: 'Dish not found.' } as ActionState;
    }
    await prisma.dishes.update({
      where: { id: dishId },
      data: { name, price: parseFloat(price), description, tags, isAvailable },
    });
  }

  revalidatePath('/panel/dishes');
  return { message: dishId ? 'Dish updated successfully!' : 'Dish created successfully!' } as ActionState;
});
```

- [ ] **Step 3: Type-check**

Run: `cd apps/menu-go && pnpm tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/menu-go/src/app/actions.ts
git commit -m "feat(actions): postDish reads userId from session, verifies ownership"
```

---

## Task 6: Migrate `postRestaurant` to `authedAction`

**Files:**
- Modify: `apps/menu-go/src/app/actions.ts`

- [ ] **Step 1: Drop `userId` from `postRestaurantSchema`**

```ts
const postRestaurantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required'),
  cuisineType: z.string().optional().default(''),
  primaryColor: z.string().optional().default('#4F46E5'),
  backgroundColor: z.string().optional().default('#FFFFFF'),
});
```

- [ ] **Step 2: Replace `postRestaurant` body**

Add Prisma type import at top of `actions.ts`:

```ts
import { Prisma } from '../../../../packages/db/generated/prisma';
```

(Or whatever path other actions use for Prisma types.)

Then:

```ts
export const postRestaurant = authedAction(
  postRestaurantSchema,
  async ({ session, input }) => {
    const userId = session.user.id;
    const { name, address, phone, cuisineType, primaryColor, backgroundColor } = input;

    const existConfig = await prisma.configRestaurant.findFirst({ where: { userId } });

    let restaurantResp;
    if (!existConfig) {
      let slug = generateSlug(name);
      const existing = await prisma.configRestaurant.findFirst({ where: { slug } });
      if (existing) slug = `${slug}-${Date.now()}`;

      const restaurant = await prisma.configRestaurant.create({
        data: { name, userId, address, phone, slug, cuisineType, primaryColor, backgroundColor },
      });

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
      const menuUrl = `${siteUrl}/r/${slug || restaurant.id}`;
      const qrUrl = await QRCode.toDataURL(menuUrl);

      restaurantResp = await prisma.configRestaurant.update({
        where: { id: restaurant.id },
        data: { qrCode: qrUrl },
      });
    } else {
      const updateData: Prisma.ConfigRestaurantUpdateInput = { name, address, phone };
      if (cuisineType) updateData.cuisineType = cuisineType;
      if (primaryColor) updateData.primaryColor = primaryColor;
      if (backgroundColor) updateData.backgroundColor = backgroundColor;
      if (name !== existConfig.name && !existConfig.slug) {
        const slug = generateSlug(name);
        const dupe = await prisma.configRestaurant.findFirst({ where: { slug, NOT: { id: existConfig.id } } });
        if (!dupe) updateData.slug = slug;
      }
      restaurantResp = await prisma.configRestaurant.update({
        where: { id: existConfig.id },
        data: updateData,
      });
    }

    revalidatePath('/panel');
    revalidatePath('/d');

    return {
      message: existConfig ? 'Business updated successfully!' : 'Business created successfully!',
      data: restaurantResp,
    };
  },
);
```

Drop the `revalidatePath('/d')` line if the demo path is already removed at this point. Keep it for now; Task 12 cleans it up.

Note: the previous `existUser` lookup / on-the-fly user create is removed — with the demo path gone, an authed session always implies a `User` row exists.

- [ ] **Step 3: Type-check**

Run: `cd apps/menu-go && pnpm tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/menu-go/src/app/actions.ts
git commit -m "feat(actions): postRestaurant reads userId from session"
```

---

## Task 7: Migrate `updateDish` to `requireSession` with ownership

**Files:**
- Modify: `apps/menu-go/src/app/actions.ts`

- [ ] **Step 1: Replace `updateDish`**

```ts
export async function updateDish(id: string, image: string): Promise<ActionState> {
  try {
    const session = await requireSession();
    const own = await prisma.dishes.findFirst({
      where: { id, configRestaurant: { userId: session.user.id } },
      select: { id: true },
    });
    if (!own) return { message: 'Dish not found.' };
    await prisma.dishes.update({ where: { id }, data: { image } });
    revalidatePath('/panel/dishes');
    return { message: 'Image updated.' };
  } catch (e) {
    if (e instanceof UnauthorizedError) return { message: 'Sign in required.', requiresAuth: true };
    console.error(e);
    return { message: 'Something went wrong.' };
  }
}
```

Import `requireSession` and `UnauthorizedError` from `../lib/server-action` at the top of `actions.ts`.

Verify the caller (`Uploader` component) handles the new return value or, if it ignores returns, no change needed.

Run: `grep -rn "updateDish" apps/menu-go/src` and inspect call site.

- [ ] **Step 2: Type-check**

Run: `cd apps/menu-go && pnpm tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/menu-go/src/app/actions.ts
git commit -m "feat(actions): updateDish requires session and verifies ownership"
```

---

## Task 8: Migrate `addCategory` to `authedAction` with Zod + top-level `openai`

**Files:**
- Modify: `apps/menu-go/src/app/actions.ts`

- [ ] **Step 1: Top of file — replace `require` with import**

Remove the inline `const OpenAI = require('openai').default;` and add at top of file:

```ts
import OpenAI from 'openai';
```

- [ ] **Step 2: Replace `addCategory`**

```ts
const addCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(80),
  description: z.string().max(500).optional().default(''),
  configRestaurantId: z.string().uuid().optional(),
});

export const addCategory = authedAction(addCategorySchema, async ({ session, input }) => {
  const { name, description, configRestaurantId } = input;

  if (configRestaurantId) {
    const own = await prisma.configRestaurant.findFirst({
      where: { id: configRestaurantId, userId: session.user.id },
      select: { id: true },
    });
    if (!own) return { message: 'Restaurant not found.' };
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const image = await openai.images.generate({ model: 'dall-e-2', prompt: name });
  const imageUrl = image.data?.[0]?.url;
  if (!imageUrl) return { message: 'Image generation failed.' };

  const res = await fetch(imageUrl, { cache: 'no-store' });
  const blobImage = await res.blob();
  const blob = await put(name, blobImage, { access: 'public', addRandomSuffix: true });

  await prisma.category.create({
    data: {
      name,
      description,
      image: blob.url,
      ...(configRestaurantId ? { configRestaurantId } : {}),
    },
  });

  revalidatePath('/panel/categories');
  return { message: 'Category created.' };
});
```

- [ ] **Step 3: Type-check**

Run: `cd apps/menu-go && pnpm tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/menu-go/src/app/actions.ts
git commit -m "feat(actions): addCategory uses authedAction with Zod, top-level openai"
```

---

## Task 9: Migrate `postBulkDishes` and `parseMenuFromPhoto` to `requireSession`

**Files:**
- Modify: `apps/menu-go/src/app/actions.ts`

- [ ] **Step 1: Replace `postBulkDishes` signature and body**

Drop the `userId` parameter:

```ts
export async function postBulkDishes(
  categories: Array<{
    name: string;
    dishes: Array<{ name: string; description: string; price: number; tags: string[] }>;
  }>,
): Promise<ActionState> {
  try {
    const session = await requireSession();
    const config = await prisma.configRestaurant.findFirst({ where: { userId: session.user.id } });
    if (!config) return { message: 'Create your restaurant profile first.' };

    await prisma.$transaction(async (tx) => {
      for (const cat of categories) {
        let category = await tx.category.findFirst({
          where: { name: cat.name, configRestaurantId: config.id },
        });
        if (!category) {
          category = await tx.category.create({
            data: { name: cat.name, description: cat.name, configRestaurantId: config.id },
          });
        }
        for (const dish of cat.dishes) {
          await tx.dishes.create({
            data: {
              name: dish.name,
              description: dish.description || '',
              price: dish.price || 0,
              tags: dish.tags || [],
              configRestaurantId: config.id,
              categoryId: category.id,
            },
          });
        }
      }
    });

    revalidatePath('/panel/dishes');
    return { message: 'Bulk import complete.' };
  } catch (e) {
    if (e instanceof UnauthorizedError) return { message: 'Sign in required.', requiresAuth: true };
    console.error(e);
    return { message: 'Bulk import failed.' };
  }
}
```

- [ ] **Step 2: Update `parseMenuFromPhoto` to gate on session**

Wrap with `requireSession` at top:

```ts
export async function parseMenuFromPhoto(imageBase64: string): Promise<{
  categories: Array<{ name: string; dishes: Array<{ name: string; description: string; price: number; tags: string[] }> }>;
} | null> {
  await requireSession();
  // ...existing body unchanged
}
```

If the caller currently passes `userId` somewhere downstream, drop it.

- [ ] **Step 3: Update all callers of `postBulkDishes`**

Run: `grep -rn "postBulkDishes" apps/menu-go/src`

Remove any `userId` argument at each call site.

- [ ] **Step 4: Type-check**

Run: `cd apps/menu-go && pnpm tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/menu-go/src/app/actions.ts apps/menu-go/src/components/PhotoMenuImporter
git commit -m "feat(actions): postBulkDishes + parseMenuFromPhoto require session"
```

---

## Task 10: Migrate authed reads to `requireSession`

**Files:**
- Modify: `apps/menu-go/src/app/actions.ts`

These reads currently take `userId` as a parameter and trust it. Replace each with internal session lookup.

- [ ] **Step 1: Replace `getRestaurant`**

```ts
export async function getRestaurant(): Promise<Restaurant | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const existConfig = await prisma.configRestaurant.findFirst({ where: { userId: session.user.id } });
  if (!existConfig) return null;
  return {
    name: existConfig.name,
    address: existConfig.address,
    phone: existConfig.phone,
    qrCode: existConfig.qrCode,
    id: existConfig.id,
    slug: existConfig.slug,
    cuisineType: existConfig.cuisineType,
    logoUrl: existConfig.logoUrl,
    primaryColor: existConfig.primaryColor,
    backgroundColor: existConfig.backgroundColor,
  };
}
```

Add at top of `actions.ts` if not present:

```ts
import { getServerSession } from 'next-auth';
import { authOptions } from '../lib/auth';
```

Reads return `null` on unauth (rather than throw) so server components don't crash on render.

- [ ] **Step 2: Replace `getDishes`**

```ts
export async function getDishes(): Promise<IDish[] | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const config = await prisma.configRestaurant.findFirst({ where: { userId: session.user.id } });
  if (!config) return null;
  const dishes = await prisma.dishes.findMany({
    where: { configRestaurantId: config.id },
    include: { category: true },
  });
  return dishes;
}
```

- [ ] **Step 3: Replace `getDish`**

```ts
export async function getDish(id: string): Promise<IDish | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const dish = await prisma.dishes.findFirst({
    where: { id, configRestaurant: { userId: session.user.id } },
    include: { category: true },
  });
  return dish;
}
```

- [ ] **Step 4: Replace `getMenuStats`**

```ts
export async function getMenuStats() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { totalViews: 0, qrScans: 0 };
  const config = await prisma.configRestaurant.findFirst({ where: { userId: session.user.id } });
  if (!config) return { totalViews: 0, qrScans: 0 };
  const [totalViews, qrScans] = await Promise.all([
    prisma.menuView.count({ where: { configRestaurantId: config.id } }),
    prisma.menuView.count({ where: { configRestaurantId: config.id, source: 'qr' } }),
  ]);
  return { totalViews, qrScans };
}
```

- [ ] **Step 5: Replace `getOnboardingStatus`**

```ts
export async function getOnboardingStatus(): Promise<{ hasCategory: boolean; hasDish: boolean }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { hasCategory: false, hasDish: false };
  const restaurant = await prisma.configRestaurant.findFirst({
    where: { userId: session.user.id },
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

- [ ] **Step 6: Replace `getAllCategories` and `getCategory`**

```ts
export async function getAllCategories() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  const config = await prisma.configRestaurant.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  return prisma.category.findMany({
    where: {
      OR: [
        ...(config ? [{ configRestaurantId: config.id }] : []),
        { configRestaurantId: null },
      ],
    },
  });
}

export async function getCategory(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const config = await prisma.configRestaurant.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  return prisma.category.findFirst({
    where: {
      id,
      OR: [
        ...(config ? [{ configRestaurantId: config.id }] : []),
        { configRestaurantId: null },
      ],
    },
  });
}
```

- [ ] **Step 7: Update all callers**

Run: `grep -rn "getRestaurant\|getDishes\|getDish(\|getMenuStats\|getOnboardingStatus\|getAllCategories\|getCategory(" apps/menu-go/src --include="*.ts" --include="*.tsx"`

Every call site that passed `userId` now drops the argument.

- [ ] **Step 8: Type-check**

Run: `cd apps/menu-go && pnpm tsc --noEmit`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/menu-go/src/app/actions.ts apps/menu-go/src/app apps/menu-go/src/components
git commit -m "feat(actions): authed reads use session; drop userId params"
```

---

## Task 11: Update `Forms/index.tsx` — drop userId/localStorage, render field errors

**Files:**
- Modify: `apps/menu-go/src/components/Forms/index.tsx`
- Modify: `apps/menu-go/src/app/panel/page.tsx`

- [ ] **Step 1: Replace `Forms/index.tsx`**

```tsx
/* eslint-disable @next/next/no-img-element */
'use client';

import 'react-toastify/dist/ReactToastify.css';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import {
  FacebookIcon,
  FacebookShareButton,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
  XIcon,
} from 'react-share';
import { toast } from 'react-toastify';

import { getRestaurant, postRestaurant, Restaurant } from '../../app/actions';
import SuccessMessage from '../Alerts';
import InfoAlert from './info-alert';

const initialState = { message: null as string | null };

type FormProps = { initialRestaurant: Restaurant | null };

export default function Form({ initialRestaurant }: FormProps) {
  const [restaurantD, setRestaurantD] = useState<Restaurant | null>(initialRestaurant);
  const [state, formAction] = useActionState(postRestaurant, initialState);
  const router = useRouter();
  const path = typeof window !== 'undefined' ? window.location.pathname : '';

  useEffect(() => {
    if (state?.requiresAuth) {
      router.push('/login');
      return;
    }
    if (state?.message) {
      toast.success(state.message);
      if (state.data) setRestaurantD(state.data);
    }
  }, [state, router]);

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/r/${restaurantD?.slug || restaurantD?.id}`;

  return (
    <form action={formAction} className="mt-6">
      {/* ...keep the entire existing JSX body from the current file BUT remove:
            - <UserNoAuth /> mount
            - <input type="hidden" name="userId" value={userIdD} />
          Replace `restaurantD` references with current `restaurantD` state.
          Render field errors:
      */}
      {state?.fieldErrors?.name?.[0] && (
        <p className="font-mono text-xs text-tomato">{state.fieldErrors.name[0]}</p>
      )}
      {/* (repeat per relevant field: address, phone) */}
      {/* ...rest of existing JSX unchanged */}
    </form>
  );
}

// Keep Field and ColorField sub-components unchanged.
```

For brevity above: the engineer copies the existing JSX, removes the two items, and inserts `fieldErrors` paragraphs after each relevant input. The structural change is: no `userIdD` state, no `useEffect` reading localStorage, no `<UserNoAuth />`, no hidden `userId` input.

- [ ] **Step 2: Update `panel/page.tsx`**

```tsx
import type { Metadata } from 'next';

import Form from '../../components/Forms';
import OnboardingBanner from '../../components/OnboardingBanner';
import { getOnboardingStatus, getRestaurant } from '../actions';

export const metadata: Metadata = {
  title: 'Panel',
  description: 'main panel',
};

export default async function Page() {
  const [{ hasCategory, hasDish }, initialRestaurant] = await Promise.all([
    getOnboardingStatus(),
    getRestaurant(),
  ]);

  return (
    <>
      <OnboardingBanner hasCategory={hasCategory} hasDish={hasDish} />
      <Form initialRestaurant={initialRestaurant} />
    </>
  );
}
```

- [ ] **Step 3: Type-check + lint**

Run: `cd apps/menu-go && pnpm tsc --noEmit && pnpm lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/menu-go/src/components/Forms/index.tsx apps/menu-go/src/app/panel/page.tsx
git commit -m "feat(panel): Form reads restaurant via server, drop client userId"
```

---

## Task 12: Update `dishesForm.tsx` — drop userId/localStorage, typed `category`

**Files:**
- Modify: `apps/menu-go/src/components/Forms/dishesForm.tsx`

- [ ] **Step 1: Replace `dishesForm.tsx`**

```tsx
'use client';

import 'react-toastify/dist/ReactToastify.css';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';
import { toast } from 'react-toastify';

import { postDish } from '../../app/actions';
import { IDish } from '../../types/dish';
import SuccessMessage from '../Alerts';
import Uploader from '../Uploader';

const initialState = { message: null as string | null };

type CategoryLite = { name: string; description?: string | null };

type IDishesForm = {
  categoryId: string;
  dish?: IDish | null;
  category?: CategoryLite | null;
};

export default function DishesForm({ categoryId, dish, category }: IDishesForm) {
  const [state, formAction] = useActionState(postDish, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state?.requiresAuth) {
      router.push('/login');
      return;
    }
    if (state?.message) {
      toast.success(state.message);
      router.back();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="mt-6">
      {/* ...existing JSX body, BUT REMOVE:
            - <UserNoAuth /> mount
            - <input type="hidden" name="userId" value={userIdD} />
          And insert field error rendering under each Zod-validated input, e.g.:
      */}
      {state?.fieldErrors?.name?.[0] && (
        <p className="font-mono text-xs text-tomato">{state.fieldErrors.name[0]}</p>
      )}
      {/* ...rest unchanged */}
      {dish && (
        <div className="mt-8">
          <Uploader dishId={dish.id} />
        </div>
      )}
    </form>
  );
}
```

Engineer copies the existing JSX inside `<form>` and removes the two listed items. The `userId` prop, `userIdD` state, localStorage effect, and `UserNoAuth` mount all go away.

- [ ] **Step 2: Update call sites**

Run: `grep -rn "DishesForm" apps/menu-go/src --include="*.tsx"`

Remove the `userId={...}` prop from every render.

- [ ] **Step 3: Update tests**

Open `apps/menu-go/__test__/dish-form.test.tsx`. Remove any `userId="..."` prop from the rendered component. If a test mocks the localStorage read, delete that setup.

- [ ] **Step 4: Type-check + run that test file**

```
cd apps/menu-go && pnpm tsc --noEmit
cd apps/menu-go && pnpm test -- --testPathPattern=dish-form
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/menu-go/src/components/Forms/dishesForm.tsx apps/menu-go/__test__/dish-form.test.tsx apps/menu-go/src
git commit -m "feat(forms): DishesForm drops userId prop and localStorage demo path"
```

---

## Task 13: Remove localStorage from `List/dishes.tsx` and `Dishes/qr-button.tsx`

**Files:**
- Modify: `apps/menu-go/src/components/List/dishes.tsx`
- Modify: `apps/menu-go/src/components/Dishes/qr-button.tsx`
- Modify: pages that render these components (to pass server-fetched data)

- [ ] **Step 1: `List/dishes.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';

import { IDish } from '../../types/dish';
import EmptyList from './empty-list';
import RemoveButton from './remove-button';

type Props = { dishes: IDish[] | null };

export default function ListDishes({ dishes }: Props) {
  const [dishesD, setDishes] = useState<IDish[] | null>(dishes);
  useEffect(() => setDishes(dishes), [dishes]);

  // ...keep existing JSX body unchanged (Th, Td, table)
}
```

No more `getDishes` call from the client. The parent server component is responsible for passing `dishes` prop. If a parent currently renders `<ListDishes />` with no `dishes` prop, update that parent to call `await getDishes()` and pass the result.

Run: `grep -rn "ListDishes" apps/menu-go/src --include="*.tsx"`

- [ ] **Step 2: `Dishes/qr-button.tsx`**

```tsx
'use client';

import { useState } from 'react';

import type { Restaurant } from '../../app/actions';
import DialogDish from './dialog-dish';

type Props = { restaurant: Restaurant | null };

export default function DishHeader({ restaurant }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex justify-end pt-2">
        <button type="button" onClick={() => setOpen(true)} className="btn-brut-lime text-xs">
          ◧ QR Code
        </button>
      </div>
      <DialogDish open={open} setOpen={setOpen} restaurant={restaurant} />
    </>
  );
}
```

Parent server component must call `await getRestaurant()` and pass the result.

Run: `grep -rn "DishHeader" apps/menu-go/src --include="*.tsx"` to find call sites.

- [ ] **Step 3: Type-check + lint**

Run: `cd apps/menu-go && pnpm tsc --noEmit && pnpm lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/menu-go/src/components/List/dishes.tsx apps/menu-go/src/components/Dishes/qr-button.tsx apps/menu-go/src
git commit -m "refactor(components): pass dishes/restaurant from server, drop localStorage"
```

---

## Task 14: Delete `/d/*` route tree, `UserNoAuth`, `referalId` linkage

**Files:**
- Delete: `apps/menu-go/src/app/d/` (recursive)
- Delete: `apps/menu-go/src/components/Menu/user-no-auth.tsx`

- [ ] **Step 1: Audit remaining references**

Run: `grep -rn "user-no-auth\|UserNoAuth\|/d/\|referalId\|usedIdTemp" apps/menu-go/src`

Expected after Tasks 11–13: only references are inside files about to be deleted, plus any login handling of `referalId`.

If `apps/menu-go/src/pages/login/index.tsx` (or wherever the login page lives) reads `router.query.referalId`, delete that block — it was demo-only.

- [ ] **Step 2: Delete files**

```bash
rm -rf apps/menu-go/src/app/d
rm apps/menu-go/src/components/Menu/user-no-auth.tsx
```

- [ ] **Step 3: Re-grep to confirm clean**

Run: `grep -rn "user-no-auth\|UserNoAuth\|usedIdTemp\|referalId" apps/menu-go/src`
Expected: zero results.

- [ ] **Step 4: Build to confirm**

Run: `cd apps/menu-go && pnpm tsc --noEmit && pnpm build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A apps/menu-go/src
git commit -m "feat: remove /d demo route and localStorage userId path"
```

---

## Task 15: Update `__test__/actions.test.ts` to new contract

**Files:**
- Modify: `apps/menu-go/__test__/actions.test.ts`

- [ ] **Step 1: Read the existing file**

Run: `cd apps/menu-go && cat __test__/actions.test.ts | head -200`

The file currently mocks `zod` globally. For the new actions to work in tests, the file should mock `next-auth` and remove `userId` from FormData inputs.

- [ ] **Step 2: Add session mock at top of file**

Insert near the top with the other `jest.mock` blocks:

```ts
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../src/lib/auth', () => ({ authOptions: {} }));
```

- [ ] **Step 3: In each test, set session and drop form `userId`**

For every `postDish` / `postRestaurant` / `addCategory` test, add at the top of the test body:

```ts
const { getServerSession } = require('next-auth');
(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });
```

Remove any `formData.append('userId', ...)` lines.

Add at least one new test per migrated action:

```ts
it('postDish: returns requiresAuth when no session', async () => {
  const { getServerSession } = require('next-auth');
  (getServerSession as jest.Mock).mockResolvedValue(null);
  const fd = new FormData();
  fd.append('name', 'Pizza');
  fd.append('price', '10');
  fd.append('categoryId', 'c1');
  const res = await postDish({ message: null }, fd);
  expect(res.requiresAuth).toBe(true);
});

it('postDish: ignores form-supplied userId', async () => {
  const { getServerSession } = require('next-auth');
  (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'real-user' } });
  // Set up prisma mocks: existConfig found for real-user, none for attacker
  // ...assert prisma.configRestaurant.findFirst was called with { where: { userId: 'real-user' } }
});
```

The exact assertions depend on the existing prisma mock harness in the file — engineer should follow the same shape already in use.

- [ ] **Step 4: Run the test file**

Run: `cd apps/menu-go && pnpm test -- --testPathPattern=actions`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/menu-go/__test__/actions.test.ts
git commit -m "test(actions): mock session, assert userId from session not form"
```

---

## Task 16: Final lint, full test run, smoke

**Files:** none

- [ ] **Step 1: Full lint**

Run: `pnpm lint`
Expected: PASS. No remaining `eslint-disable @typescript-eslint/no-explicit-any` or `@ts-ignore` in the touched files.

- [ ] **Step 2: Full test suite**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 3: Production build**

Run: `pnpm build`
Expected: PASS.

- [ ] **Step 4: Manual smoke**

Start dev server: `pnpm dev`

Verify in browser:
- `/login` redirects unauthed user from `/panel/*` (already enforced by NextAuth pages config — confirm)
- Unauthed POST attempt to a server action returns `requiresAuth: true` and the client redirects to `/login`. To test: open `/panel/dishes/<cat>/edit/<dish>` while signed in, then in DevTools clear the session cookie, submit form, expect redirect.
- Signed-in user can create + edit a restaurant, dish, and category.
- Hidden `<input name="userId">` is gone from rendered HTML (DevTools inspect).
- `/d/*` URLs return 404.

If any step fails, stop and fix before declaring done.

- [ ] **Step 5: Final commit (only if cleanup remains)**

```bash
git status
# If anything's outstanding, address it. Otherwise nothing to commit here.
```

---

## Spec coverage map

| Spec section | Tasks |
|---|---|
| Action wrapper | 1 |
| Identity + ownership rules | 5, 6, 7, 8, 9, 10 |
| Demo path removal | 11, 12, 13, 14 |
| Type cleanup — `prevState: any` | 5, 6, 8 (wrapper inference) |
| Type cleanup — `updateData: any` | 6 |
| Type cleanup — `category: any` | 4, 12 |
| Type cleanup — `@ts-ignore` in auth.ts | 3 |
| Type cleanup — NextAuth augmentation | 2 |
| `addCategory` Zod + top-level openai | 8 |
| Error mapping (`ActionState`, `requiresAuth`) | 1, 11, 12 |
| Testing — wrapper unit tests | 1 |
| Testing — postDish session + cross-tenant | 15 |
| Testing — postRestaurant session | 15 |
| Migration / Rollout — no DB migration, single PR | All |
| Smoke checks | 16 |
