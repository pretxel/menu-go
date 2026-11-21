# Spec Delta: data-access

## Purpose

Defines how menu-go reads and writes its data inside the Supabase project it shares with other applications: isolation from the other apps, server-only access, and atomicity of multi-step writes.

## ADDED Requirements

### Requirement: Isolation inside the shared database
All menu-go database objects (tables, functions, triggers) SHALL carry the `mg_` prefix, and menu-go SHALL NOT create, alter, drop or read objects belonging to other applications in the same project.

#### Scenario: Schema change touches only menu-go objects
- **WHEN** a menu-go database migration is applied to the shared project
- **THEN** only objects whose names start with `mg_` are created, altered or dropped, and every non-`mg_` table keeps its structure and row count

#### Scenario: Setup needs no database password
- **WHEN** menu-go is configured for a new environment
- **THEN** it needs only the project URL and a server-side service credential, never a Postgres connection string or database password

### Requirement: Server-only data access
menu-go data SHALL be reachable only from server-side code holding the service credential. Requests made with the project's public (anon) key or an end-user Supabase token MUST NOT be able to read or modify any `mg_` table or call any `mg_` function, and the service credential MUST NOT be exposed to the browser.

#### Scenario: Anonymous API read is refused
- **WHEN** a client calls the project's REST API with the public anon key to select from any `mg_` table
- **THEN** the request returns no rows or a permission error, never menu-go data

#### Scenario: Anonymous RPC call is refused
- **WHEN** a client calls any `mg_` database function with the public anon key
- **THEN** the call is rejected with a permission error and changes nothing

#### Scenario: Service credential stays on the server
- **WHEN** the production client bundle is inspected
- **THEN** it contains no service-role credential

### Requirement: Atomic catalog imports
Importing a catalog (restaurant creation on first publish, plus its categories and dishes) SHALL be all-or-nothing: if any part fails, no restaurant, category or dish from that import is persisted.

#### Scenario: Failure mid-import leaves no partial catalog
- **WHEN** a publish or bulk import fails while writing its dishes
- **THEN** none of the categories, dishes or (on first publish) the restaurant from that request exist afterwards, and the action returns an error

#### Scenario: Same-name categories reused within an import
- **WHEN** an import contains a category whose name already exists for that restaurant
- **THEN** its dishes are attached to the existing category and no duplicate category is created

### Requirement: Server-maintained identifiers and timestamps
New `mg_` rows SHALL receive their identifier and creation time from the database when the caller omits them, and update timestamps SHALL be refreshed by the database on every update.

#### Scenario: Insert without id
- **WHEN** a restaurant, category or dish is inserted without an `id`
- **THEN** the stored row has a unique generated identifier and a creation timestamp

#### Scenario: Update refreshes updatedAt
- **WHEN** a restaurant or dish row is updated
- **THEN** its `updatedAt` is later than before the update
