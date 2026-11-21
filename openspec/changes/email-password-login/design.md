# Design: Email and password login

## Context

See proposal.md (Why). Relevant current state:

- NextAuth v4, JWT sessions, no adapter (`src/lib/auth.ts`). The `signIn` callback calls `persistSignIn()`, which upserts `mg_user` by `email` and, for OAuth, `mg_account`. The `jwt` callback looks the user up by email.
- The Credentials provider's `authorize()` returns a fixed fake user for any input. It is registered in every environment, including production.
- `mg_user` already has `password text NULL` and `emailVerified timestamp NULL` (from the original NextAuth schema), both unused. `email` has a case-sensitive unique index.
- No email provider is configured, so there is no way to verify an address or send a reset link.
- Supabase access is server-only through `getSupabase()` (service role); `mg_*` tables have RLS on and no anon/authenticated grants.

## Goals / Non-Goals

**Goals:**
- Replace the stub with real credential checks; behavior per spec `password-auth`.
- No new runtime dependency and no new external service.

**Non-Goals:**
- Password reset, email verification, password change UI (need an email provider; separate change).
- IP-based rate limiting (needs a shared store such as Redis); the per-account lockout covers credential stuffing against one account.
- Switching to Supabase Auth.

## Decisions

### 1. Hashing: Node `crypto.scrypt`
`src/lib/password.ts` exports `hashPassword(plain)` and `verifyPassword(plain, stored)`. Format: `scrypt$<N>$<r>$<p>$<salt b64>$<hash b64>` with N=2^15, r=8, p=1, 16-byte random salt, 64-byte key; comparison with `crypto.timingSafeEqual`. Parameters live in the stored string, so they can be raised later without breaking existing hashes.
- *Alternative:* `bcryptjs` / `argon2`. Rejected: an extra dependency (argon2 is native, awkward on Vercel) for no gain over scrypt, which is built in and memory-hard.
- `verifyPassword` against a fixed dummy hash when the email is unknown or has no password, so response time does not reveal which emails exist.

### 2. Sign-up endpoint
`POST /api/sign-up` (logic in `src/lib/sign-up.ts`) validates with Zod (`email`, `password` 8–128, `name` optional ≤100), lowercases the email, hashes, and inserts into `mg_user`. A unique violation (`23505`) returns 409 "An account with this email already exists. Sign in instead."; validation errors return 400 with `fieldErrors`. It is a JSON route rather than a server action because `/login` is a Pages Router page, where server actions are unavailable. It never updates an existing row. After success the client calls `signIn('credentials', { email, password, redirect: false })` and then navigates to the callback URL, so session creation goes through the same path as sign-in.
- *Alternative:* create the user inside `authorize()` on first use. Rejected: mixes sign-up and sign-in, and a typo in the email would silently create a new account.

### 3. `authorize()` checks credentials and lockout
1. Lowercase the email, load `id, email, name, image, password, failedLoginCount, lockedUntil`.
2. Missing user or `password IS NULL` → dummy verify, return `null`.
3. `lockedUntil > now()` → return `null` (generic error; the user is not told it is locked, to avoid confirming the account exists).
4. Wrong password → increment `failedLoginCount`; at 5 set `lockedUntil = now() + 15 min` and reset the count to 0. Return `null`.
5. Correct → reset `failedLoginCount = 0, lockedUntil = null`, return `{ id, email, name, image }`.
The increment is a read-then-update, so concurrent failures can undercount by a few; acceptable for a lockout threshold.

### 4. OAuth sign-in verifies the email and reclaims password accounts
`persistSignIn()` lowercases the email. For OAuth accounts it sets `emailVerified = now()`; if the existing row had `emailVerified IS NULL` and a non-null `password`, it sets `password = null` in the same update. Google and Facebook only return confirmed emails, so this is the first proof of ownership the system gets.
- For `account.type === 'credentials'`, `persistSignIn()` is skipped: the user row already exists and must not be touched.
- *Alternative:* refuse OAuth sign-in when an unverified password account exists. Rejected: the real owner would be locked out by whoever registered their email first.

### 5. Schema migration `2_mg_password_login.sql`
`ALTER TABLE mg_user ADD COLUMN "failedLoginCount" integer NOT NULL DEFAULT 0, ADD COLUMN "lockedUntil" timestamp(3) NULL;` plus `UPDATE mg_user SET email = lower(email)` and `CHECK (email = lower(email))`. Together with the existing unique index `mg_user_email_key` this makes emails unique case-insensitively, while keeping the plain-column unique index that the `upsert(..., { onConflict: 'email' })` in `persistSignIn()` needs (PostgREST cannot target an expression index). Only `mg_` objects; the table already has RLS and revokes. Regenerate `packages/db/types.ts`.

### 6. Login UI
`src/components/Login/index.tsx` gets an email/password form below the OAuth buttons with a "Create account" / "Sign in" toggle (name field only in sign-up). Errors come from the sign-up endpoint (`fieldErrors` or `error`), and from NextAuth's `error` result (`CredentialsSignin`) for sign-in, shown as "Invalid email or password." The copy "We don't need a password" is updated.

### 7. Tests
- `password.test.ts`: round trip, wrong password, distinct hashes for the same password, malformed stored value returns false.
- `auth.test.ts`: replace the stub case with `authorize()` cases (correct, wrong, unknown, OAuth-only, lockout and expiry with fake timers, stub credentials refused) and the OAuth reclaim rule.
- `sign-up.test.ts`: success (lowercased, hashed), validation errors, duplicate email unchanged.
- Login component test: sign-up mode posts the action and then calls `signIn('credentials')` with the callback URL.

## Risks / Trade-offs

- [Anyone can register any email without proving it] → They cannot take it from the real owner (decision 4), and an unverified account only reaches its own restaurant. Email verification comes with the email-provider change.
- [No password reset] → A user who forgets their password can sign in with Google/Facebook if the email matches; otherwise support resets it manually.
- [Lockout can be triggered by an attacker against a known email (denial of service for 15 minutes)] → Short window, OAuth sign-in still works.
- [scrypt N=2^15 costs ~50–100 ms CPU per attempt on a serverless function] → Acceptable for login; it is also what makes offline cracking expensive.
- [Existing mixed-case emails] → The migration lowercases them; a collision would fail the unique index, so the migration checks for duplicates first and aborts if any exist.

## Migration Plan

1. Apply `2_mg_password_login.sql` to `gridscore` (additive), regenerate types.
2. Deploy. The stub stops working at the same time as real credentials start.
3. Rollback: revert the code; the two new columns are harmless to leave.
