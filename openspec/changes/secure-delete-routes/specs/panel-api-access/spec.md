# Spec Delta: panel-api-access

## Purpose

Defines who may call the restaurant panel's mutating API routes (delete a dish, delete a category, upload an image) and which responses callers get, so one restaurant can never change another's menu.

## ADDED Requirements

### Requirement: Panel mutations require a signed-in user
Deleting a dish, deleting a category and uploading an image SHALL require a signed-in session. Without one, the route MUST respond 401 and change nothing.

#### Scenario: Anonymous dish delete is refused
- **WHEN** a request without a session calls delete on an existing dish
- **THEN** the response is 401 and the dish still exists

#### Scenario: Anonymous category delete is refused
- **WHEN** a request without a session calls delete on an existing category
- **THEN** the response is 401 and the category still exists

#### Scenario: Anonymous upload is refused
- **WHEN** a request without a session posts a file to the upload route
- **THEN** the response is 401 and nothing is stored

### Requirement: Users delete only their own dishes
A signed-in user SHALL be able to delete a dish only when it belongs to their restaurant. A dish that does not exist or belongs to another restaurant MUST get the same 404 response, so the route does not reveal which ids exist.

#### Scenario: Owner deletes their dish
- **WHEN** a signed-in user deletes a dish of their own restaurant
- **THEN** the response is 200 with the dish id and the dish no longer exists

#### Scenario: Another restaurant's dish is not found
- **WHEN** a signed-in user deletes a dish that belongs to a different restaurant
- **THEN** the response is 404 and the dish still exists

#### Scenario: Unknown dish is not found
- **WHEN** a signed-in user deletes a dish id that does not exist
- **THEN** the response is 404

### Requirement: Users delete only their own categories
A signed-in user SHALL be able to delete a category only when it belongs to their restaurant. Global categories (shared by all restaurants) and other restaurants' categories MUST get a 404 and stay unchanged.

#### Scenario: Owner deletes an empty category
- **WHEN** a signed-in user deletes a category of their own restaurant that has no dishes
- **THEN** the response is 200 with the category id and the category no longer exists

#### Scenario: Global category cannot be deleted
- **WHEN** a signed-in user deletes a global category
- **THEN** the response is 404 and the category still exists

#### Scenario: Panel offers no remove action on global categories
- **WHEN** a signed-in user views the category list in the panel
- **THEN** global categories show no remove action, and the user's own categories do

#### Scenario: Another restaurant's category is not found
- **WHEN** a signed-in user deletes a category that belongs to a different restaurant
- **THEN** the response is 404 and the category still exists

### Requirement: Categories in use are not deleted
Deleting an owned category that still has dishes SHALL be refused with 409 and a message telling the user to move or remove its dishes first. The panel MUST show that message.

#### Scenario: Category with dishes is refused
- **WHEN** a signed-in user deletes one of their categories that still has dishes
- **THEN** the response is 409 with an explanatory message, and the category and its dishes still exist

#### Scenario: Panel shows the conflict
- **WHEN** the panel's remove action gets a 409 for a category
- **THEN** the user sees the explanatory message instead of a generic error

### Requirement: Uploads accept only images
The upload route SHALL accept only image content types from a signed-in user. Any other content type MUST get 415 and nothing is stored.

#### Scenario: Image upload succeeds
- **WHEN** a signed-in user posts a file with an `image/*` content type
- **THEN** the response is 200 with the stored file's public URL

#### Scenario: Non-image upload is refused
- **WHEN** a signed-in user posts a file whose content type is not `image/*`
- **THEN** the response is 415 and nothing is stored
