# Spec Delta: auth-session

## Purpose

Defines what happens when a person signs in to menu-go: which records are kept, what the session exposes to the app, and how the restaurant panel is protected.

## ADDED Requirements

### Requirement: Sign-in records the user
On every successful sign-in the system SHALL ensure a menu-go user record exists for the signed-in email, creating it on first sign-in and reusing it afterwards. For OAuth providers it SHALL also record the provider account linked to that user, without creating duplicates on repeat sign-ins.

#### Scenario: First OAuth sign-in
- **WHEN** a person signs in with Google or Facebook for the first time
- **THEN** one user record with their email, name and image is created, and one linked provider-account record is created

#### Scenario: Repeat sign-in
- **WHEN** the same person signs in again with the same provider
- **THEN** no new user or provider-account record is created and the existing user is used

#### Scenario: Persistence failure blocks sign-in
- **WHEN** the user record cannot be created or read during sign-in
- **THEN** sign-in fails with an error page and no session is issued

### Requirement: Session exposes user and restaurant
An authenticated session SHALL expose the menu-go user id and the id of the restaurant that user owns (`configRestaurantId`), or `null` when the user has no restaurant yet. The restaurant id SHALL reflect a restaurant created after sign-in without requiring the user to sign in again.

#### Scenario: User without restaurant
- **WHEN** a newly signed-in user with no restaurant reads their session
- **THEN** the session contains their user id and `configRestaurantId: null`

#### Scenario: Restaurant created during the session
- **WHEN** a signed-in user publishes their first catalog and then loads the panel
- **THEN** the session's `configRestaurantId` is the id of the restaurant just created

### Requirement: Panel requires a session
Every `/panel` route SHALL require an authenticated session; requests without one MUST be redirected to the sign-in page.

#### Scenario: Anonymous panel visit
- **WHEN** a visitor without a session opens any `/panel` URL
- **THEN** they are redirected to `/login`

#### Scenario: Authenticated panel visit
- **WHEN** a signed-in user opens `/panel`
- **THEN** the panel renders for their restaurant
