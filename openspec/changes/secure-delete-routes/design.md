# Design: Secure the panel API routes

## Context

See proposal.md (Why). Relevant current state:

- The routes call `getSupabase()` (service role, bypasses RLS), so the route handler is the only access check.
- Server actions already use `requireSession()` from `src/lib/server-action.ts` (throws `UnauthorizedError`) and `findOwnedDish(dishId, userId)` in `actions.ts`, which joins `mg_config_restaurant!inner(userId)`.
- `mg_dishes.categoryId` references `mg_category` with `ON DELETE RESTRICT`, so deleting a category with dishes fails with Postgres error `23503` (foreign_key_violation), which today surfaces as an unhandled 500.
- `/api/upload` declares `runtime = 'edge'`. Its only caller is the dish image uploader inside the panel.

## Goals / Non-Goals

**Goals:**
- One ownership check per route, done in the same query as the delete.
- Status codes as in spec `panel-api-access`.

**Non-Goals:**
- No change to the category ownership model (global categories stay visible to everyone; they just cannot be deleted through the API).
- No upload size limit or image re-encoding (Vercel's request body limit still applies).
- No move of these routes to server actions.

## Decisions

### 1. Session check with `requireSession()`
The routes call the existing `requireSession()` and map `UnauthorizedError` to 401. This keeps one definition of "signed in" (`session.user.id` from the JWT) shared with the server actions.
- *Alternative:* `getToken()` from `next-auth/jwt`, which also works on the Edge runtime. Rejected: a second way of reading the session, and the upload route does not need Edge.

### 2. Ownership in the delete query itself
Resolve the caller's restaurant id (`mg_config_restaurant` where `userId` = session user), then delete with both filters: `.delete().eq('id', id).eq('configRestaurantId', restaurantId).select('id').maybeSingle()`. Zero rows deleted → 404. Because the filter is part of the delete, there is no gap between check and delete, and global categories (`configRestaurantId IS NULL`) never match.
- A user with no restaurant gets 404 directly.
- *Alternative:* reuse `findOwnedDish()` then delete by id. Rejected: two queries with a check-then-act gap, and no equivalent helper exists for categories.

### 3. Map the foreign-key error to 409
When the category delete returns error code `23503`, respond 409 with `{ error: 'Category still has dishes. Move or delete them first.' }`. Other errors still throw and become a 500.
- *Alternative:* count dishes before deleting. Rejected: extra query and a race; the database constraint is already the source of truth.

### 4. Shared helper for route responses
A small `src/lib/route-auth.ts` exports `withSession(handler)` that runs `requireSession()`, passes the session to the handler, and turns `UnauthorizedError` into `401 { error: 'Sign in required.' }`. All three routes use it. Error bodies use `{ error: string }`; success bodies are unchanged (`{ id }`, blob JSON), so the remove modal's success check keeps working.

### 5. Upload route on the Node.js runtime
Drop `export const runtime = 'edge'` so `getServerSession` works. Reject content types not starting with `image/` with 415 before calling `put()`. The filename extension keeps coming from the content type, now guaranteed to be an image subtype.

### 6. Tests call the real handlers
Route tests import the handlers directly, mock `next-auth`'s `getServerSession`, and use the existing in-memory Supabase fake. The fake needs to return error code `23503` when a category with dishes is deleted (add an FK check to its delete, or a `failNext` with a code). `api-upload.test.ts` stops replicating the logic and calls `POST`.

## Risks / Trade-offs

- [Node.js runtime is slower to start than Edge for `/api/upload`] → Upload is a rare panel action; a cold start is acceptable.
- [The panel's category list (`getAllCategories`) includes global categories, each with a remove button] → `ItemCategory` hides the remove button when `configRestaurantId` is null, so users never hit the 404. Global categories are managed by the seed.
- [409 message is English-only] → Same as the other panel toasts today.

## Migration Plan

Code-only change; ships with the next deploy. Rollback is a revert. No data migration.
