# API Reference

This document covers all server actions and API routes in the Menu-GO application.

## Server Actions

Server actions are defined in `apps/menu-go/src/app/actions.ts`. They are invoked directly from React components (via `useFormState` or direct calls) and execute on the server.

### Restaurant Management

#### `postRestaurant(prevState, formData)`

Creates or updates a restaurant configuration.

| Parameter | Type | Source | Description |
|-----------|------|--------|-------------|
| `name` | string | FormData | Restaurant name (required) |
| `address` | string | FormData | Restaurant address |
| `phone` | string | FormData | Phone number |
| `cuisineType` | string | FormData | Type of cuisine |
| `userId` | string | FormData | Owner user ID |

**Behavior:**
- If no restaurant exists for the user: creates a new `ConfigRestaurant`, generates a URL-friendly slug from the name, generates a QR code (base64 data URL) pointing to `/menu/{slug}`, and creates a `User` record if needed
- If a restaurant already exists: updates name, address, phone, and optionally cuisineType and slug
- Slug collision handling: appends a timestamp suffix if the generated slug already exists

**Returns:** `{ message: string, restaurant?: ConfigRestaurant }`

**Side effects:** Revalidates `/panel` and `/d` paths.

---

#### `getRestaurant(userId)`

Retrieves the restaurant configuration for a user.

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | Owner user ID |

**Returns:** `Restaurant | null` -- Object with name, address, phone, id, slug, qrCode, cuisineType, logoUrl.

**Auth required:** No (but requires knowing the userId).

---

### Dish Management

#### `postDish(prevState, formData)`

Creates or updates a dish.

| Parameter | Type | Source | Description |
|-----------|------|--------|-------------|
| `name` | string | FormData | Dish name (required) |
| `price` | string | FormData | Price as string (parsed to float) |
| `categoryId` | string | FormData | Category to assign the dish to |
| `userId` | string | FormData | Owner user ID |
| `dishId` | string | FormData | Existing dish ID (for updates) |
| `description` | string | FormData | Dish description |
| `tags` | string | FormData | Comma-separated tags (e.g., "vegan,spicy") |
| `isAvailable` | string | FormData | "false" to disable, anything else for true |

**Behavior:**
- Looks up the user's restaurant config
- If `dishId` matches an existing dish: updates name, price, description, tags, isAvailable
- If no match: creates a new dish linked to the restaurant and category

**Returns:** `{ message: string }`

**Side effects:** Revalidates `/panel/dishes`.

---

#### `updateDish(id, image)`

Updates a dish's image URL (typically after uploading to Vercel Blob).

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Dish ID |
| `image` | string | Image URL |

**Returns:** void

---

#### `getDishes(userId)`

Retrieves all dishes for a user's restaurant, including category data.

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | Owner user ID |

**Returns:** `IDish[] | null`

---

#### `getDish(id)`

Retrieves a single dish by ID, including category data.

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Dish ID |

**Returns:** `IDish | undefined | null`

---

### Menu (Public)

#### `getMenu(restaurantId)`

Retrieves a restaurant's full menu by UUID. Only includes dishes where `isAvailable = true`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `restaurantId` | string | Restaurant UUID |

**Returns:** `ConfigRestaurant` with `Dishes[]` (each including `category`).

**Throws:** Error if no restaurant found.

---

#### `getMenuBySlug(slug)`

Retrieves a restaurant's full menu by slug. Falls back to `getMenu(slug)` if no slug match (backward compatibility with UUID-based URLs).

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | string | URL-friendly restaurant slug |

**Returns:** Same as `getMenu()`.

---

### Analytics

#### `trackMenuView(restaurantId, source)`

Records a menu page view for analytics.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `restaurantId` | string | -- | Restaurant UUID |
| `source` | string | `"direct"` | View source: `"direct"` or `"qr"` |

**Returns:** void (silently fails on error to avoid breaking page loads).

---

#### `getMenuStats(userId)`

Retrieves view statistics for a user's restaurant.

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | Owner user ID |

**Returns:** `{ totalViews: number, qrScans: number }`

---

### Category Management

#### `getAllCategories(configRestaurantId?)`

Retrieves categories. If a `configRestaurantId` is provided, returns both global categories (where `configRestaurantId` is null) and restaurant-specific categories. Otherwise returns all categories.

| Parameter | Type | Description |
|-----------|------|-------------|
| `configRestaurantId` | string (optional) | Restaurant ID to filter by |

**Returns:** `Category[]`

---

#### `getCategory(id)`

Retrieves a single category by ID.

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Category ID |

**Returns:** `Category | null`

---

#### `addCategory(prevState, formData)`

Creates a new category with an AI-generated image.

| Parameter | Type | Source | Description |
|-----------|------|--------|-------------|
| `name` | string | FormData | Category name |
| `description` | string | FormData | Category description |
| `configRestaurantId` | string or null | FormData | Optional restaurant ownership |

**Behavior:**
1. Calls DALL-E 2 with the category name as prompt to generate an image
2. Fetches the generated image and uploads it to Vercel Blob
3. Creates the category record with the blob URL

**Returns:** `{ message: string }`

**Side effects:** Revalidates `/panel/categories`.

**Requires:** `OPENAI_API_KEY` environment variable.

---

### AI Menu Parsing

#### `parseMenuFromPhoto(imageBase64)`

Uses GPT-4o vision to extract structured menu data from a photo of a physical menu.

| Parameter | Type | Description |
|-----------|------|-------------|
| `imageBase64` | string | Base64-encoded image (data URL format) |

**Returns:**
```typescript
{
  categories: Array<{
    name: string;
    dishes: Array<{
      name: string;
      description: string;
      price: number;
      tags: string[];  // "vegan", "vegetarian", "spicy", "gluten-free", "dairy-free"
    }>;
  }>;
} | null
```

**Requires:** `OPENAI_API_KEY` environment variable.

---

#### `postBulkDishes(userId, categories)`

Bulk-imports dishes from parsed menu data. Runs in a Prisma transaction.

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | Owner user ID |
| `categories` | Array | Parsed category/dish structure (same format as `parseMenuFromPhoto` output) |

**Behavior:**
1. Finds user's restaurant config
2. For each category: finds or creates a restaurant-specific category
3. For each dish: creates a dish record linked to the category and restaurant

**Throws:** Error if restaurant not found.

**Side effects:** Revalidates `/panel/dishes`.

---

## API Routes

### `POST /api/upload`

Uploads a file to Vercel Blob storage.

**Runtime:** Edge

**Request:**
- Body: Raw file binary
- Header: `content-type` -- MIME type of the file (e.g., `image/png`)

**Response:**
```json
{
  "url": "https://...",
  "pathname": "...",
  "contentType": "image/png",
  "contentDisposition": "..."
}
```

**Auth required:** No (no authentication check).

---

### `DELETE /api/dishes/[dishId]`

Deletes a dish by ID.

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `dishId` | string | UUID of the dish to delete |

**Response:**
```json
{ "id": "deleted-dish-uuid" }
```

**Auth required:** No (no authentication check on the route itself).

---

### `DELETE /api/category/[categoryId]`

Deletes a category by ID.

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `categoryId` | string | UUID of the category to delete |

**Response:**
```json
{ "id": "deleted-category-uuid" }
```

**Auth required:** No (no authentication check on the route itself).

**Note:** Deleting a category that still has dishes associated with it will fail due to the foreign key constraint.

---

### `GET/POST /api/auth/[...nextauth]`

NextAuth.js catch-all route. Handles all authentication flows (sign in, sign out, callbacks, CSRF).

See the [NextAuth.js documentation](https://next-auth.js.org/getting-started/rest-api) for the full list of endpoints.
