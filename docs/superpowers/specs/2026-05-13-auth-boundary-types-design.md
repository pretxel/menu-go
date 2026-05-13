# Auth Boundary + Types Cleanup — Design

**Date:** 2026-05-13
**Scope:** `apps/menu-go` — server actions, forms, auth lib, type surface
**Status:** Approved (pending spec review)

## Problem

Server actions in `apps/menu-go/src/app/actions.ts` read `userId` from `formData`, treating client-supplied input as identity. Any authenticated user can POST another user's `userId` in a hidden form field; the server proceeds without verifying the value against the session. Anonymous users on `/d/*` mint a UUID into `localStorage.usedIdTemp` that becomes the same trusted `userId`. Both paths feed the same actions, so the trust boundary is effectively absent.

Adjacent debt: `prevState: any` and `category?: any` annotations, `@ts-ignore` on env vars in `auth.ts`, missing Zod validation on `addCategory`, and `localStorage`-based demo plumbing leaking into authed forms.

## Goals

1. Server actions read `userId` only from the NextAuth session.
2. All mutating actions verify resource ownership before write.
3. Demo path (`/d/*`, `usedIdTemp`) removed end-to-end.
4. `any` types eliminated from `actions.ts`, form components, and auth lib.
5. Uniform action return shape with field-level errors.

## Non-Goals

- Prisma `Dishes` → `Dish` rename (separate bundle).
- QR base64 → Blob storage (separate bundle).
- `Category` ownership migration / timestamps (separate bundle).
- Rate limiting, CSRF beyond what NextAuth provides.
- New auth providers or password flows.

## Architecture

### Action wrapper

New file `apps/menu-go/src/lib/server-action.ts`:

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

export class UnauthorizedError extends Error {}

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new UnauthorizedError('Not signed in');
  return session as { user: { id: string; email?: string | null } };
}

type Handler<S extends ZodSchema, R> = (args: {
  session: Awaited<ReturnType<typeof requireSession>>;
  input: z.infer<S>;
}) => Promise<ActionState<R>>;

export function authedAction<S extends ZodSchema, R = void>(
  schema: S,
  handler: Handler<S, R>,
) {
  return async (_prev: ActionState<R>, formData: FormData): Promise<ActionState<R>> => {
    try {
      const session = await requireSession();
      const raw = Object.fromEntries(formData.entries());
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        return { message: null, fieldErrors: parsed.error.flatten().fieldErrors };
      }
      return handler({ session, input: parsed.data });
    } catch (e) {
      if (e instanceof UnauthorizedError) return { message: 'Sign in required.', requiresAuth: true };
      console.error(e);
      return { message: 'Something went wrong.' };
    }
  };
}
```

Non-form authed reads call `requireSession()` directly. Public reads (`getMenu`, `getMenuBySlug`, `trackMenuView`) keep no-auth signatures and are scoped by `restaurantId` or `slug`.

### Identity + ownership rules

| Function | userId source | Ownership check |
|---|---|---|
| `postDish` | `session.user.id` | Update path: `where: { id: dishId, configRestaurant: { userId } }` |
| `postRestaurant` | `session.user.id` | `findFirst({ where: { userId } })` |
| `updateDish` | `session.user.id` | `where: { id, configRestaurant: { userId } }` |
| `addCategory` | `session.user.id` | If `configRestaurantId` supplied, assert restaurant.userId === session.user.id |
| `postBulkDishes` | `session.user.id` | Restaurant lookup by session userId |
| `parseMenuFromPhoto` | `session.user.id` | Gate only (no DB write) |
| `getDishes` | `session.user.id` | Scoped by session restaurant |
| `getDish` | `session.user.id` | `where: { id, configRestaurant: { userId } }` |
| `getRestaurant` | `session.user.id` | Scoped by session userId |
| `getMenuStats` | `session.user.id` | Scoped by session restaurant |
| `getOnboardingStatus` | `session.user.id` | Scoped by session restaurant |
| `getAllCategories` | `session.user.id` | OR(configRestaurantId by session, null shared) |
| `getCategory` | `session.user.id` | Verify ownership or shared (null configRestaurantId) |
| `getMenu` | none (public) | Scoped by `restaurantId` param |
| `getMenuBySlug` | none (public) | Scoped by `slug` param |
| `trackMenuView` | none (public) | Scoped by `restaurantId` param |

### Demo path removal

Delete:
- `apps/menu-go/src/app/d/` (entire route tree)
- `apps/menu-go/src/components/Menu/user-no-auth.tsx`
- All `localStorage.getItem('usedIdTemp')` / `setItem` call sites:
  - `components/Forms/index.tsx` (userId effect)
  - `components/Forms/dishesForm.tsx` (userId effect + `userIdD` state)
  - `components/List/dishes.tsx`
  - `components/Dishes/qr-button.tsx`
- Hidden `<input name="userId">` from both forms
- `<UserNoAuth />` mounts
- `?referalId=` handling on `/login` (verify usage before delete)

`OnboardingBanner` localStorage usage (`DISMISS_KEY`) stays — unrelated UI state.

### Type cleanup

1. `actions.ts`: remove file-level `eslint-disable @typescript-eslint/no-explicit-any`. Drop `prevState: any` (inferred via wrapper). Replace `updateData: any` with `Prisma.ConfigRestaurantUpdateInput`.
2. `dishesForm.tsx`: remove eslint-disable. Replace `category?: any` with `Pick<Category, 'name' | 'description'> | null`. Drop `userId` prop.
3. `Forms/index.tsx`: remove untyped `{ userId }` param.
4. `auth.ts`: remove three `// @ts-ignore` by reading env vars through `envOrThrow(key)` helper that throws at module load if missing.
5. NextAuth type augmentation in `apps/menu-go/src/types/next-auth.d.ts`:
   ```ts
   declare module 'next-auth' {
     interface Session {
       user: {
         id: string;
         email?: string | null;
         name?: string | null;
         image?: string | null;
         configRestaurantId?: string | null;
       };
     }
   }
   ```
6. `addCategory`: replace `require('openai')` with top-level `import OpenAI from 'openai'`. Wrap in `authedAction` with schema:
   ```ts
   z.object({
     name: z.string().min(1).max(80),
     description: z.string().max(500).optional().default(''),
     configRestaurantId: z.string().uuid().optional(),
   })
   ```

### Error mapping

Single return shape `ActionState<T>`:
- `message`: toast string (success or generic failure), `null` when only field errors present
- `fieldErrors`: Zod `flatten().fieldErrors` for inline rendering
- `data`: typed payload (e.g., `restaurant` on `postRestaurant`)
- `requiresAuth`: set when wrapper caught `UnauthorizedError`; client redirects to `/login`

Replaces ad-hoc `{ message }` / `{ message, restaurant }` returns. Forms render `state.fieldErrors?.name?.[0]` next to inputs. Forms watch `state.requiresAuth` and call `router.push('/login')` rather than matching message strings.

`console.error(e)` for unexpected throws. Generic `'Something went wrong.'` returned to client — no internals exposed. Replaces existing `ERROO todo` debug string at `actions.ts:77`.

## Testing

- `__test__/lib/server-action.test.ts` — `authedAction` unit tests:
  - Unauth path returns `requiresAuth: true`
  - Zod failure returns `fieldErrors`, no handler call
  - Happy path calls handler with parsed input + session
- `__test__/actions/postDish.test.ts`:
  - Form-supplied `userId` is ignored; session wins
  - Cross-tenant `dishId` update rejected
- `__test__/actions/postRestaurant.test.ts`: same pattern
- Mock `getServerSession` from `next-auth`. Reuse Jest setup.

## Migration / Rollout

- No DB migration.
- Pure code change in one PR.
- Breaking for any in-flight `/d/*` anonymous users — accepted (kill switch).
- Pre-merge: run `pnpm lint`, `pnpm test`, manual smoke of `/panel/restaurant`, `/panel/dishes` create + edit.

## Open Questions

None at time of writing. All scope decisions resolved during brainstorming.
