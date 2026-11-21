# Proposal

## Why

Restaurant owners can only sign in with Google or Facebook, which excludes people without (or unwilling to use) those accounts. Worse, the existing Credentials provider is a development stub that accepts any username and password and signs the caller in as the same fake user (`jsmith@example.com`), and it is live in production: anyone can get a panel session. Real email/password sign-in replaces that stub.

## What Changes

- **BREAKING (security fix):** remove the stub that accepts any credentials. The Credentials provider only signs in a user whose email and password match a stored account.
- New sign-up: a person creates an account with email, password and optional name. Passwords are stored only as a salted, slow hash in `mg_user.password`.
- New sign-in with email and password on `/login`, next to the Google and Facebook buttons, honoring the same `callbackUrl` (so the `/d` funnel keeps working).
- Brute-force protection: after repeated failed attempts an account is temporarily locked.
- Email ownership: an unverified password account never blocks or captures the real owner of the email. Signing up with an email that already has an account is refused, and a later Google sign-in with that email takes over the account and invalidates its unverified password.
- Errors never reveal whether an email is registered at sign-in ("Invalid email or password.").

Out of scope: password reset and email verification (no email provider is configured), changing passwords from the panel.

## Capabilities

### New Capabilities
- `password-auth`: account creation with email and password, password sign-in, lockout after failed attempts, and how password accounts coexist with OAuth sign-in for the same email.

### Modified Capabilities
<!-- none in openspec/specs/. The auth-session capability from migrate-to-supabase-js is not archived yet; nothing here changes its requirements. -->

## Impact

- Code: `apps/menu-go/src/lib/auth.ts` (Credentials `authorize`, OAuth sign-in clearing unverified passwords), new `src/lib/password.ts`, new sign-up server action, `src/components/Login/index.tsx` (form + sign-up mode).
- Database: migration `2_mg_password_login.sql` adds `failedLoginCount` and `lockedUntil` to `mg_user` (mg_ only, same RLS/revoke rules). `packages/db/types.ts` regenerated.
- Dependencies: none (uses Node's built-in `crypto.scrypt`).
- Tests: `auth.test.ts` drops the stub case; new tests for hashing, sign-up, sign-in, lockout and the OAuth takeover rule.
