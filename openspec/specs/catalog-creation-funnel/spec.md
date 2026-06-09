# Spec: catalog-creation-funnel

## Purpose

Public, no-account-required funnel at `/d` where a visitor uploads a menu photo, gets AI-extracted categories and dishes, reviews/edits them, and proceeds to publish. Authentication is only required at the extraction step, and funnel state survives the sign-in redirect.

## Requirements

### Requirement: Public funnel entry at /d
The system SHALL serve a public catalog-creation page at `/d`, reachable without authentication, matching the links already present on the landing page and `/learn`.

#### Scenario: Anonymous visitor opens /d
- **WHEN** an unauthenticated visitor navigates to `/d`
- **THEN** the funnel page renders with a photo upload step (no redirect to login, no 404)

#### Scenario: Authenticated user opens /d
- **WHEN** an authenticated user navigates to `/d`
- **THEN** the same funnel page renders and the user can proceed directly to extraction

### Requirement: Photo selection without an account
The system SHALL let a visitor select a menu photo (file picker or drag-and-drop) and preview it locally before any authentication or server call.

#### Scenario: Visitor drops an image file
- **WHEN** a visitor drags an image file onto the upload zone
- **THEN** the photo is previewed client-side and the "Extract menu" action becomes available

#### Scenario: Visitor selects a non-image file
- **WHEN** a visitor selects a file whose type is not `image/*`
- **THEN** an error message is shown and no upload or extraction occurs

### Requirement: Extraction requires a session
The system SHALL require an authenticated session before running AI menu extraction; the server action MUST reject unauthenticated calls.

#### Scenario: Unauthenticated user triggers extraction
- **WHEN** an unauthenticated visitor presses "Extract menu"
- **THEN** the funnel saves its state and redirects the visitor to sign-in with a callback returning to `/d`

#### Scenario: Direct unauthenticated server-action call
- **WHEN** `parseMenuFromPhoto` is invoked without a valid session
- **THEN** the action throws/returns an authentication error and no Anthropic API call is made

### Requirement: Funnel state survives sign-in redirect
The system SHALL persist the selected photo and any extraction result across the authentication redirect and restore the user to their previous step on return to `/d`.

#### Scenario: State restored after OAuth round-trip
- **WHEN** a visitor with a selected photo signs in and is redirected back to `/d`
- **THEN** the photo (and extraction result, if it existed) is restored and the funnel resumes at the saved step

#### Scenario: Stored photo exceeds storage quota
- **WHEN** the photo is too large to persist in session storage
- **THEN** extraction results (if any) are still persisted and the user is asked to re-select the photo only if extraction had not yet run

### Requirement: Editable extraction preview
The system SHALL display extracted categories and dishes in an editable preview where the user can correct names and prices before publishing.

#### Scenario: Successful extraction shows preview
- **WHEN** extraction returns at least one category
- **THEN** the funnel shows categories with their dishes, editable name and price fields, and a publish step

#### Scenario: Extraction returns nothing
- **WHEN** extraction returns no categories
- **THEN** the funnel shows "Could not extract menu items. Try a clearer photo." and lets the user retry with another photo
