# auth-validation

## ADDED Requirements

### Requirement: Sign-in works against the Supabase database
NextAuth sign-in SHALL complete successfully with the application connected to Supabase, using the same code path as before (PrismaAdapter).

#### Scenario: Credentials sign-in creates a session
- **WHEN** a user signs in via the Credentials provider on `/login`
- **THEN** a `next-auth.session-token` cookie is issued and the user is redirected to `/panel`

#### Scenario: OAuth sign-in persists user rows
- **WHEN** a user signs in via Google or Facebook (when provider env keys are configured)
- **THEN** corresponding `User` and `Account` rows exist in the Supabase database

### Requirement: Session enrichment reads from Supabase
The NextAuth session callback SHALL enrich the session with `user.id` and `configRestaurantId` resolved from the Supabase database.

#### Scenario: Session payload includes restaurant config
- **WHEN** an authenticated client requests `/api/auth/session`
- **THEN** the response includes `user.id`, and `configRestaurantId` is the user's restaurant id or `null` when none exists

### Requirement: Panel routes remain protected
Middleware SHALL continue to guard `/panel` routes when backed by Supabase.

#### Scenario: Anonymous access redirected
- **WHEN** a request without a valid `next-auth.session-token` cookie targets `/panel`
- **THEN** the request is redirected to `/login`

#### Scenario: Authenticated access allowed
- **WHEN** a request with a valid session cookie targets `/panel`
- **THEN** the panel page renders without redirect

### Requirement: Post-setup health check passes
The Supabase project SHALL show no critical security or performance advisories attributable to this change, and auth-related queries SHALL produce no errors in database logs during validation.

#### Scenario: Advisors reviewed
- **WHEN** Supabase advisors are fetched after setup
- **THEN** no critical issues introduced by this change are present (pre-existing/unrelated findings are recorded, not fixed)

#### Scenario: Logs clean during auth flow
- **WHEN** the sign-in validation flow runs and Postgres logs are fetched
- **THEN** no errors related to NextAuth/Prisma queries appear
