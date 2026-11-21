# Tasks

## 1. Shared route auth

- [x] 1.1 Add `src/lib/route-auth.ts` with `withSession(handler)`: runs `requireSession()`, passes the session, maps `UnauthorizedError` to `401 { error: 'Sign in required.' }`. Verify: unit test covers the 401 path and the pass-through path.
- [x] 1.2 Extend `__test__/helpers/supabase-fake.ts` so deleting an `mg_category` row referenced by `mg_dishes.categoryId` returns `{ error: { code: '23503' } }` and deletes nothing. Verify: fake unit check in the category route test (task 3.2).

## 2. Delete dish

- [x] 2.1 Rewrite `src/app/api/dishes/[dishId]/route.ts` with `withSession`: resolve the caller's restaurant, delete with `eq('id')` + `eq('configRestaurantId')`, `maybeSingle()`; no row → 404 `{ error }`. (Restaurant lookup shared as `src/lib/owned-restaurant.ts`, also used by `auth.ts`.) Verify: new `__test__/api-dishes-delete.test.ts` covers 401 anonymous, 200 owner (row gone), 404 other restaurant (row kept), 404 unknown id, 404 user without restaurant.

## 3. Delete category

- [x] 3.1 Rewrite `src/app/api/category/[categoryId]/route.ts` the same way; map error code `23503` to `409 { error: 'Category still has dishes. Move or delete them first.' }`. Verify: new `__test__/api-category-delete.test.ts` covers 401, 200 owner empty category, 404 global category (row kept), 404 other restaurant, 409 category with dishes (category and dishes kept).
- [x] 3.2 In `src/components/List/remove-modal.tsx`, show the response's `error` message in the toast when deletion fails (fallback to the generic text). Verify: test renders the modal with a mocked `fetch` returning 409 and asserts the conflict message toast.
- [x] 3.3 In `src/components/Categories/item-category.tsx`, render `RemoveButton` only when `category.configRestaurantId` is set. Verify: `remove-category.test.tsx` (not `category.test.tsx`, which covers the public menu component) asserts no remove button for a global category and one for an owned category.

## 4. Upload

- [x] 4.1 In `src/app/api/upload/route.ts`, drop `runtime = 'edge'`, wrap with `withSession`, return 415 `{ error }` for content types not starting with `image/` before calling `put()`. Verify: `__test__/api-upload.test.ts` rewritten to call `POST` directly: 401 anonymous (no `put`), 415 `text/plain` (no `put`), 200 `image/png` returns blob JSON.

## 5. Integration

- [x] 5.1 Run `pnpm test`, `pnpm lint`, `pnpm build`. Verify: all pass; test count above the previous 105 (now 122).
- [ ] 5.2 Smoke-test on the preview deploy (with `migrate-to-supabase-js` 6.2): anonymous `curl -X DELETE /api/dishes/<id>` returns 401; in the panel, deleting own dish works, a global category shows no remove button, deleting a category with dishes shows the conflict toast, dish image upload works. Verify: each check observed.

## Workflow follow-up

- Archive with `/opsx:archive` after deploy; it creates `openspec/specs/panel-api-access/`.
