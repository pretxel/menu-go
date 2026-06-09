# Spec: shareable-menu-page

## ADDED Requirements

### Requirement: Publish yields a single public menu page by default
Every published catalog SHALL be reachable as a single public page at `/r/<slug>` without authentication, and this page SHALL be the URL encoded in the catalog's QR code.

#### Scenario: Visitor opens the published page
- **WHEN** anyone navigates to `/r/<slug>` for a published catalog
- **THEN** the menu renders publicly with its available categories and dishes, no login required

#### Scenario: QR scan resolves to the page
- **WHEN** a customer scans the catalog's QR code
- **THEN** the browser opens `/r/<slug>` for that restaurant

### Requirement: Success screen with share artifacts
After a successful publish, the funnel SHALL show a success screen containing the QR code image, the public menu URL, a copy-link action, and a download-QR action.

#### Scenario: Success screen content
- **WHEN** `publishCatalog` succeeds
- **THEN** the user sees the QR code, the `/r/<slug>` URL, a button that copies the URL to the clipboard, and a button that downloads the QR image

#### Scenario: Copy link
- **WHEN** the user presses the copy-link button
- **THEN** the absolute menu URL is placed on the clipboard and visual confirmation is shown

#### Scenario: Download QR
- **WHEN** the user presses the download-QR button
- **THEN** the QR code image downloads as a file usable for print
