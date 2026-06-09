# supabase-database

## ADDED Requirements

### Requirement: Supabase project provisioned for Menu-GO
The system SHALL have a dedicated Supabase project (managed Postgres) for Menu-GO, created in the user's organization after explicit cost confirmation.

#### Scenario: Project exists and is healthy
- **WHEN** the Supabase organization is queried for projects
- **THEN** a Menu-GO project exists with status `ACTIVE_HEALTHY`

#### Scenario: Cost confirmed before creation
- **WHEN** the project does not yet exist
- **THEN** project creation proceeds only after the cost is retrieved and confirmed

### Requirement: Dual connection configuration
The application SHALL connect to Supabase using a pooled connection string (`DATABASE_URL`, transaction-mode pooler) at runtime, and Prisma CLI operations SHALL use a session-mode/direct connection string (`DIRECT_URL`).

#### Scenario: Runtime uses pooled connection
- **WHEN** the Next.js app executes a Prisma query
- **THEN** the connection goes through the Supavisor transaction pooler URL in `DATABASE_URL`

#### Scenario: CLI uses direct connection
- **WHEN** `pnpm db:push`, `db:seed`, or a migration command runs
- **THEN** Prisma uses `DIRECT_URL` (session pooler) for the connection

#### Scenario: Docker fallback still works
- **WHEN** `DIRECT_URL` is not set and `DATABASE_URL` points at local Docker Postgres
- **THEN** Prisma CLI commands fall back to `DATABASE_URL` and continue to work

### Requirement: Schema and seed data deployed to Supabase
The existing Prisma schema SHALL be pushed to the Supabase database and seeded, with no schema changes beyond connection wiring.

#### Scenario: All Prisma models present
- **WHEN** the Supabase `public` schema is listed after `pnpm db:push`
- **THEN** tables for `User`, `Account`, `Session`, `VerificationToken`, `ConfigRestaurant`, `Dishes`, and `Category` exist

#### Scenario: Seed data loaded
- **WHEN** `pnpm db:seed` completes
- **THEN** the `Category` table contains the default categories

### Requirement: Environment documentation updated
`.env.example` and project docs SHALL document the Supabase connection variables without committing real credentials.

#### Scenario: Example env shows Supabase variables
- **WHEN** a developer reads `.env.example`
- **THEN** it contains placeholder `DATABASE_URL` (pooled) and `DIRECT_URL` (direct/session) entries with comments explaining each

#### Scenario: No secrets committed
- **WHEN** the change is committed
- **THEN** no real Supabase password or service key appears in tracked files
