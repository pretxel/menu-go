# Spec: one-step-publish

## ADDED Requirements

### Requirement: Single publish action creates the whole catalog
The system SHALL provide a `publishCatalog` server action that, in one call, creates the restaurant configuration (with slug and QR code) and imports all extracted categories and dishes, returning the public slug, QR code, and menu URL.

#### Scenario: First-time publish
- **WHEN** an authenticated user with no existing restaurant publishes funnel state containing a restaurant name and extracted categories
- **THEN** a `ConfigRestaurant` is created with a unique slug and a QR code pointing to `/r/<slug>`, all categories and dishes are created and linked to it, and the action returns `{ slug, qrCode, menuUrl }`

#### Scenario: Publish requires authentication
- **WHEN** `publishCatalog` is invoked without a valid session
- **THEN** the action returns an authentication error and creates nothing

### Requirement: Only restaurant name is mandatory at publish
The publish action SHALL require only the restaurant name; address and phone MUST be optional in the funnel path and stored as empty values when omitted.

#### Scenario: Publish with name only
- **WHEN** a user publishes with a restaurant name and no address or phone
- **THEN** the publish succeeds and the public menu page renders without the missing fields

### Requirement: Publish into an existing restaurant is non-destructive
When the user already owns a restaurant, `publishCatalog` SHALL reuse it — no duplicate restaurant, slug, or QR is created — and SHALL import the extracted categories and dishes into it, reusing same-name categories.

#### Scenario: Existing restaurant, new import
- **WHEN** a user who already has a restaurant publishes new extracted categories
- **THEN** dishes are added to the existing restaurant (existing same-name categories reused, new ones created) and the action returns the existing slug and QR code

### Requirement: Production-correct QR target
QR codes generated at publish SHALL encode an absolute URL resolved from, in order: `NEXT_PUBLIC_SITE_URL`, the Vercel production URL, then `http://localhost:3000` for local development.

#### Scenario: QR generated on production without NEXT_PUBLIC_SITE_URL
- **WHEN** a catalog is published on production where `NEXT_PUBLIC_SITE_URL` is unset
- **THEN** the QR code encodes `https://<production-domain>/r/<slug>` (never a relative path)
