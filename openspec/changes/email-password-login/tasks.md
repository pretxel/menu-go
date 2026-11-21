# Tasks

## 1. Database

- [x] 1.1 Write `packages/db/migrations/2_mg_password_login.sql`: abort if `lower(email)` has duplicates, lowercase existing emails, add `"failedLoginCount" integer NOT NULL DEFAULT 0` and `"lockedUntil" timestamp(3)` to `mg_user`, add `CHECK (email = lower(email))` (keeps `mg_user_email_key` usable by the upsert; see design §5). Verify: file touches only `mg_` objects.
- [x] 1.2 Apply it to `gridscore` and regenerate `packages/db/types.ts` (mg_ only). Verify: `list_tables` shows the columns; `tsc --noEmit` in `packages/db` passes; anon key still gets permission denied on `mg_user`.

## 2. Password hashing

- [x] 2.1 Add `src/lib/password.ts` (`hashPassword`, `verifyPassword`, scrypt N=2^15 r=8 p=1, self-describing format, `timingSafeEqual`, dummy hash for unknown users). Verify: `__test__/password.test.ts` covers round trip, wrong password, distinct hashes for same input, malformed value → false.

## 3. Sign-in

- [x] 3.1 Replace the stub `authorize()` in `src/lib/auth.ts` with the credential + lockout logic (design §3); skip `persistSignIn()` for `credentials` accounts. Verify: `auth.test.ts` covers correct password, wrong password, unknown email, OAuth-only account, stub credentials (`jsmith`) refused, 5 failures lock, lock expiry resets (fake timers).
- [x] 3.2 In `persistSignIn()`, lowercase emails and, for OAuth, set `emailVerified` and clear the password when the row was unverified (design §4). Verify: `auth.test.ts` "Google sign-in reclaims an unverified password account" (password no longer verifies) and "verified account keeps its password".

## 4. Sign-up

- [x] 4.1 (Implemented as `POST /api/sign-up` + `src/lib/sign-up.ts` instead of a server action: `/login` is a Pages Router page, where server actions are not available.) Add the `signUp` server action (Zod: email, password 8–128, optional name ≤100; lowercase; hash; insert; `23505` → "already exists" message). Verify: `__test__/sign-up.test.ts` covers non-JSON body, success (lowercased email, stored value is a hash), invalid email, short password, duplicate email leaves the existing row unchanged.

## 5. Login page

- [x] 5.1 Add the email/password form with sign-in / create-account toggle to `src/components/Login/index.tsx`, keeping `targetCallbackUrl()`; sign-up calls the action then `signIn('credentials', { redirect: false })` and navigates; show field errors and "Invalid email or password."; update the "no password" copy. Verify: `__test__/login.test.tsx` covers sign-in calling `signIn('credentials')` with the callback, sign-up success flow, and the error message on `CredentialsSignin`.

## 6. Integration

- [x] 6.1 Run `pnpm test`, `pnpm lint`, `pnpm build`; update `CLAUDE.md` (Authentication section: Credentials is real email/password, lockout, OAuth reclaim). Verify: all pass, docs no longer mention a dev stub.
- [ ] 6.2 Deploy and smoke-test in production: create an account on `/login`, sign out, sign in, wrong password shows the generic error, `curl` POST of stub credentials gets no session cookie, `/d` → sign-up → publish lands back in the funnel. Verify: each check observed; `mg_user.password` starts with `scrypt$`.

## Workflow follow-up

- Archive with `/opsx:archive` after deploy; it creates `openspec/specs/password-auth/`.
- Follow-up change once an email provider exists: email verification and password reset.
