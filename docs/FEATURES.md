# Feature Documentation

This document describes the user-facing features of Menu-GO (Dineqrs).

## Overview

Dineqrs enables restaurant owners to create digital menus accessible via QR codes. The workflow is:

1. Restaurant owner signs up and configures their restaurant profile
2. A QR code is automatically generated linking to the public menu
3. Owner adds categories and dishes to their menu
4. Customers scan the QR code (or visit the URL) to view the menu on their phone

## Authentication

### Sign-In Options

| Method | Description |
|--------|-------------|
| Google | OAuth 2.0 sign-in via Google account |
| Facebook | OAuth 2.0 sign-in via Facebook account |
| Credentials (Demo) | Demo mode -- accepts any username/password for testing |

Users are redirected to `/panel` after successful login.

### Demo Mode

Users can explore the panel without authenticating. A temporary UUID is generated and stored in browser `localStorage`. This allows creating a restaurant and dishes, but the data is only accessible from that browser session.

## Restaurant Management

**Panel page:** `/panel`

### Restaurant Profile

After logging in, the user is presented with a form to configure their restaurant:

- **Name** (required) -- Restaurant name; used to generate the URL slug
- **Address** (required) -- Physical address
- **Phone** (required) -- Contact phone number
- **Cuisine Type** -- Type of cuisine (e.g., Italian, Mexican)

On first save, the system:
1. Creates a `ConfigRestaurant` record
2. Generates a URL-friendly slug from the restaurant name (e.g., "My Restaurant" becomes `my-restaurant`)
3. Generates a QR code as a base64 data URL encoding the menu link

### QR Code

After the restaurant is created, the panel displays:
- The **public menu URL** (e.g., `https://dineqrs.com/menu/my-restaurant`)
- The **QR code image** that encodes this URL
- **Social sharing buttons** for Facebook, WhatsApp, and X (Twitter)

The QR code can be printed and placed in the restaurant for customers to scan.

## Menu Management

### Categories

**Panel page:** `/panel/categories`

Categories organize dishes into groups (e.g., "Appetizers", "Main Course", "Desserts").

- **Creating a category:** Enter a name and description. An image is automatically generated using DALL-E 2 based on the category name.
- **Deleting a category:** Remove via the delete button. Categories with existing dishes cannot be deleted (foreign key constraint).
- Categories can be **global** (visible to all restaurants) or **restaurant-specific**.

### Dishes

**Panel page:** `/panel/dishes`

The dishes page shows:
1. A **product list table** with all dishes (name, category, price) and edit/delete actions
2. A **category grid** for navigating to add dishes within a specific category

#### Creating/Editing a Dish

Navigate to a category, then fill in:

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Dish name |
| Price | Yes | Numeric price |
| Description | Yes | Text description |
| Tags | No | Comma-separated dietary tags: vegan, vegetarian, spicy, gluten-free, dairy-free |
| Available | No | Toggle to show/hide on public menu (default: available) |

#### Dish Images

After creating a dish, an image uploader appears:
- Supports drag-and-drop or click-to-browse
- Accepts image files up to 50MB
- Images are uploaded to Vercel Blob and the URL is saved to the dish

#### Deleting a Dish

Each dish in the product list has a delete button that calls `DELETE /api/dishes/[dishId]`.

## Photo Import (AI Menu Parsing)

Server actions `parseMenuFromPhoto` and `postBulkDishes` support importing an entire menu from a photo:

1. User uploads a photo of a physical menu
2. GPT-4o vision analyzes the image and extracts structured data
3. The system identifies categories and dishes with names, descriptions, prices, and dietary tags
4. All extracted items are bulk-imported in a single database transaction

Recognized dietary tags: `vegan`, `vegetarian`, `spicy`, `gluten-free`, `dairy-free`.

**Note:** The UI for triggering the photo import may not be fully wired up in all views. The server-side logic is complete in `actions.ts`.

## Public Menu Display

**URL:** `/menu/[slug]` or `/menu/[restaurantId]`

When a customer scans the QR code or visits the menu URL:

1. The restaurant's menu is loaded (only dishes marked as available)
2. A **restaurant banner** is displayed at the top
3. Dishes are **grouped by category** and displayed in a responsive grid
4. Each dish card shows:
   - Image (or a placeholder icon if none)
   - Name and price
   - Description (truncated to 2 lines)
   - Dietary tags as colored badges

The menu is mobile-friendly with a responsive layout that adapts from 1 column on mobile to multiple columns on larger screens.

### Slug vs ID URLs

- **Slug URLs** (`/menu/my-restaurant`) are the primary format, generated from the restaurant name
- **ID URLs** (`/menu/uuid`) are supported for backward compatibility
- The slug route falls back to an ID lookup if no slug match is found

## Analytics

### Menu View Tracking

Every public menu page load is recorded in the `MenuView` table:

- **Source tracking:** Views are tagged as either `"direct"` (visited via URL) or `"qr"` (scanned QR code, detected via `?src=qr` query parameter)
- **Non-blocking:** Tracking runs asynchronously and silently fails to avoid impacting page load

### View Statistics

The `getMenuStats` server action provides:
- **Total views** -- All menu page loads
- **QR scans** -- Views specifically from QR code scans

### External Analytics

- **Google Tag Manager** -- Configured for page view tracking across the application
- **Vercel Analytics** -- Integrated in the panel layout for usage metrics
