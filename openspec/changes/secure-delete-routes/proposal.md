# Proposal

## Why

Three panel API routes run with the service role key and never check who is calling. Anyone who knows or guesses an id can `DELETE /api/dishes/<id>` or `DELETE /api/category/<id>`, including another restaurant's data and the global categories every restaurant shares. Anyone can also `POST /api/upload` and store arbitrary files in our Vercel Blob store at our cost. The supabase-js migration made this more visible, because the service role bypasses RLS, so these routes are now the only gate.

## What Changes

- `DELETE /api/dishes/[dishId]` requires a signed-in session and deletes only a dish that belongs to the caller's restaurant.
- `DELETE /api/category/[categoryId]` requires a signed-in session and deletes only a category owned by the caller's restaurant. Global categories (`configRestaurantId IS NULL`) can no longer be deleted through the API.
- Deleting a category that still has dishes returns a clear conflict response instead of a 500 from the foreign-key error.
- `POST /api/upload` requires a signed-in session and accepts only image content types.
- Responses use consistent status codes: 401 without a session, 404 when the row does not exist or is not the caller's (no ownership leak), 409 for a category in use, 415 for a non-image upload.
- The remove modal shows the conflict message when a category still has dishes.
- The panel's category list hides the remove button on global categories.

## Capabilities

### New Capabilities
- `panel-api-access`: who may call the panel's mutating API routes (delete dish, delete category, upload image) and which responses they get.

### Modified Capabilities
<!-- none: no existing spec covers these routes -->

## Impact

- Code: `apps/menu-go/src/app/api/dishes/[dishId]/route.ts`, `apps/menu-go/src/app/api/category/[categoryId]/route.ts`, `apps/menu-go/src/app/api/upload/route.ts`, `apps/menu-go/src/components/List/remove-modal.tsx`, `apps/menu-go/src/components/Categories/item-category.tsx`.
- `/api/upload` moves from the Edge runtime to the Node.js runtime so it can read the NextAuth session.
- Tests: new route tests for each status code; `api-upload.test.ts` exercises the real handler instead of replicating its logic.
- No database or schema change. No new dependencies.
- Depends on `migrate-to-supabase-js` (routes already use `getSupabase()`).
