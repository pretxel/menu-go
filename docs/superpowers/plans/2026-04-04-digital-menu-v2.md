# Digital Menu v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the four remaining gaps in DEFINITION.md — Claude API photo import, inline-editable import preview, restaurant branding colors, and `/r/{slug}` canonical public URL.

**Architecture:** Each feature is self-contained: Claude replaces OpenAI only in `parseMenuFromPhoto` (OpenAI stays for `addCategory`/DALL-E); branding colors require one Prisma schema migration + action + form + menu UI changes; the new `/r/[slug]` route is a copy of `/menu/[slug]` and the old route becomes a permanent redirect.

**Tech Stack:** Next.js 15 App Router, Prisma (PostgreSQL), `@anthropic-ai/sdk`, Tailwind CSS, React Server Actions, Jest + React Testing Library.

---

## File Map

| File | Change |
|------|--------|
| `apps/menu-go/package.json` | Add `@anthropic-ai/sdk` |
| `.env.example` | Add `ANTHROPIC_API_KEY` |
| `apps/menu-go/src/app/actions.ts` | Swap `parseMenuFromPhoto` to Claude; extend `Restaurant` type + `postRestaurant` + `getRestaurant` for colors; fix QR URL to `/r/` |
| `packages/db/prisma/schema.prisma` | Add `primaryColor`, `backgroundColor` to `ConfigRestaurant` |
| `apps/menu-go/src/components/PhotoMenuImporter/index.tsx` | Add inline name/price editing to preview |
| `apps/menu-go/src/components/Forms/index.tsx` | Add color pickers; update URL display to `/r/` |
| `apps/menu-go/src/components/Menu/index.tsx` | Apply CSS custom properties from restaurant branding |
| `apps/menu-go/src/components/Menu/dish.tsx` | Use `var(--color-primary)` for price text |
| `apps/menu-go/src/app/r/[slug]/page.tsx` | New canonical public menu route |
| `apps/menu-go/src/app/r/[slug]/error.tsx` | Error boundary for new route |
| `apps/menu-go/src/app/r/[slug]/loading.tsx` | Loading skeleton for new route |
| `apps/menu-go/src/app/menu/[slug]/page.tsx` | Replace with `permanentRedirect` to `/r/{slug}` |
| `apps/menu-go/__test__/actions.test.ts` | Add tests for `parseMenuFromPhoto` with Anthropic mock |

---

## Task 1: Install Anthropic SDK and swap `parseMenuFromPhoto` to Claude

**Files:**
- Modify: `apps/menu-go/package.json`
- Modify: `.env.example`
- Modify: `apps/menu-go/src/app/actions.ts` (lines 1–6, 349–392)
- Modify: `apps/menu-go/__test__/actions.test.ts`

- [ ] **Step 1: Write the failing test**

Add these tests to `apps/menu-go/__test__/actions.test.ts`.

First, add the Anthropic mock at the top of the file alongside the existing mocks (after the `openai` mock):

```typescript
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(),
    },
  }));
});
```

Then add this import at the bottom of the imports block:

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { parseMenuFromPhoto } from '../src/app/actions';
```

And add these test cases after the `trackMenuView` describe block:

```typescript
describe('parseMenuFromPhoto', () => {
  let mockCreate: jest.Mock;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AnthropicMock = Anthropic as any;
    mockCreate = jest.fn();
    AnthropicMock.mockImplementation(() => ({
      messages: { create: mockCreate },
    }));
  });

  it('returns parsed categories from tool_use response', async () => {
    const expected = {
      categories: [
        {
          name: 'Starters',
          dishes: [{ name: 'Nachos', description: 'With cheese', price: 8.5, tags: ['vegetarian'] }],
        },
      ],
    };

    mockCreate.mockResolvedValue({
      content: [{ type: 'tool_use', name: 'extract_menu', input: expected }],
    });

    const result = await parseMenuFromPhoto('data:image/jpeg;base64,abc123');
    expect(result).toEqual(expected);
  });

  it('returns null when response has no tool_use block', async () => {
    mockCreate.mockResolvedValue({ content: [{ type: 'text', text: 'oops' }] });

    const result = await parseMenuFromPhoto('data:image/jpeg;base64,abc123');
    expect(result).toBeNull();
  });

  it('strips data URL prefix and passes only base64 data to Claude', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'tool_use', name: 'extract_menu', input: { categories: [] } }],
    });

    await parseMenuFromPhoto('data:image/png;base64,xyz789');

    const callArg = mockCreate.mock.calls[0][0];
    const imageBlock = callArg.messages[0].content[0];
    expect(imageBlock.source.data).toBe('xyz789');
    expect(imageBlock.source.media_type).toBe('image/png');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd apps/menu-go && pnpm test -- --testPathPattern=actions.test -t "parseMenuFromPhoto"
```

Expected: FAIL — `@anthropic-ai/sdk` not installed, `parseMenuFromPhoto` still uses OpenAI.

- [ ] **Step 3: Install `@anthropic-ai/sdk`**

```bash
cd apps/menu-go && pnpm add @anthropic-ai/sdk
```

- [ ] **Step 4: Add `ANTHROPIC_API_KEY` to `.env.example`**

In `.env.example`, add after the existing entries:

```
ANTHROPIC_API_KEY=           # Anthropic API key for photo menu parsing
```

- [ ] **Step 5: Swap `parseMenuFromPhoto` in `actions.ts`**

Replace the import at line 6:

```typescript
// Remove this line:
import OpenAI from 'openai';

// Add this line:
import Anthropic from '@anthropic-ai/sdk';
```

Note: `openai` import is still needed for `addCategory` (DALL-E image generation). Add it back as a local require inside `addCategory` instead:

Replace the `addCategory` function's first line:

```typescript
export async function addCategory(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const configRestaurantId = formData.get('configRestaurantId') as string | null;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const OpenAI = require('openai').default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  // rest of function unchanged...
```

Replace the entire `parseMenuFromPhoto` function (lines 349–392) with:

```typescript
export async function parseMenuFromPhoto(imageBase64: string): Promise<{
  categories: Array<{
    name: string;
    dishes: Array<{ name: string; description: string; price: number; tags: string[] }>;
  }>;
} | null> {
  const [header, base64Data] = imageBase64.split(',');
  const mediaType = (header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg') as
    | 'image/jpeg'
    | 'image/png'
    | 'image/gif'
    | 'image/webp';

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    tools: [
      {
        name: 'extract_menu',
        description: 'Extract all menu items from the image into structured data.',
        input_schema: {
          type: 'object' as const,
          properties: {
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  dishes: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        price: { type: 'number' },
                        tags: {
                          type: 'array',
                          items: {
                            type: 'string',
                            enum: ['vegan', 'vegetarian', 'spicy', 'gluten-free', 'dairy-free'],
                          },
                        },
                      },
                      required: ['name', 'description', 'price', 'tags'],
                    },
                  },
                },
                required: ['name', 'dishes'],
              },
            },
          },
          required: ['categories'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'extract_menu' },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Data },
          },
          {
            type: 'text',
            text: 'Extract all menu items from this image. Use price 0 if not visible.',
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') return null;

  return toolUse.input as {
    categories: Array<{
      name: string;
      dishes: Array<{ name: string; description: string; price: number; tags: string[] }>;
    }>;
  };
}
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
cd apps/menu-go && pnpm test -- --testPathPattern=actions.test -t "parseMenuFromPhoto"
```

Expected: PASS (3 tests).

- [ ] **Step 7: Run full test suite to confirm no regressions**

```bash
cd /Users/edselserrano/Projects/personal/menu-go-frontend && pnpm test
```

Expected: All existing tests still pass.

- [ ] **Step 8: Commit**

```bash
git add apps/menu-go/package.json apps/menu-go/src/app/actions.ts apps/menu-go/__test__/actions.test.ts .env.example pnpm-lock.yaml
git commit -m "feat: swap photo menu parsing from OpenAI to Claude API"
```

---

## Task 2: Inline-editable preview in PhotoMenuImporter

**Files:**
- Modify: `apps/menu-go/src/components/PhotoMenuImporter/index.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/menu-go/__test__/photo-menu-importer.test.tsx`:

```typescript
/**
 * @jest-environment jsdom
 */
import { act, render, screen, fireEvent } from '@testing-library/react';
import PhotoMenuImporter from '../src/components/PhotoMenuImporter';

jest.mock('../src/app/actions', () => ({
  parseMenuFromPhoto: jest.fn(),
  postBulkDishes: jest.fn(),
}));

import { postBulkDishes } from '../src/app/actions';

describe('PhotoMenuImporter — editable preview', () => {
  const parsedCategories = [
    {
      name: 'Starters',
      dishes: [{ name: 'Nachos', description: 'Crispy', price: 8.5, tags: [] }],
    },
  ];

  function renderWithCategories() {
    const { rerender } = render(<PhotoMenuImporter userId="user-1" />);

    // Click "Import from photo" to open
    fireEvent.click(screen.getByText('Import from photo'));

    // Inject parsed categories directly via state — simulate post-parse state
    // by re-rendering with the component in open+parsed state
    // We do this by calling the exposed handler
    rerender(<PhotoMenuImporter userId="user-1" />);
    return { rerender };
  }

  it('renders name and price inputs after parse', () => {
    const { container } = render(<PhotoMenuImporter userId="user-1" initialCategories={parsedCategories} />);
    fireEvent.click(screen.getByText('Import from photo'));

    const nameInputs = container.querySelectorAll('input[data-field="name"]');
    const priceInputs = container.querySelectorAll('input[data-field="price"]');

    expect(nameInputs).toHaveLength(1);
    expect(priceInputs).toHaveLength(1);
    expect((nameInputs[0] as HTMLInputElement).value).toBe('Nachos');
    expect((priceInputs[0] as HTMLInputElement).value).toBe('8.5');
  });

  it('editing name updates state before import', async () => {
    render(<PhotoMenuImporter userId="user-1" initialCategories={parsedCategories} />);
    fireEvent.click(screen.getByText('Import from photo'));

    const nameInput = screen.getByDisplayValue('Nachos');
    fireEvent.change(nameInput, { target: { value: 'Edited Nachos' } });

    const mockPostBulkDishes = postBulkDishes as jest.Mock;
    mockPostBulkDishes.mockResolvedValue(undefined);

    await act(async () => {
      fireEvent.click(screen.getByText('Import all'));
    });

    expect(mockPostBulkDishes).toHaveBeenCalledWith(
      'user-1',
      expect.arrayContaining([
        expect.objectContaining({
          dishes: expect.arrayContaining([
            expect.objectContaining({ name: 'Edited Nachos' }),
          ]),
        }),
      ])
    );
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd apps/menu-go && pnpm test -- --testPathPattern=photo-menu-importer
```

Expected: FAIL — component doesn't accept `initialCategories` prop and has no `data-field` attributes.

- [ ] **Step 3: Update `PhotoMenuImporter` with editable preview**

Replace `apps/menu-go/src/components/PhotoMenuImporter/index.tsx` with:

```typescript
'use client';

import { useCallback, useRef, useState } from 'react';

import { parseMenuFromPhoto, postBulkDishes } from '../../app/actions';

type ParsedDish = { name: string; description: string; price: number; tags: string[] };
type ParsedCategory = { name: string; dishes: ParsedDish[] };

type PhotoMenuImporterProps = {
  userId: string;
  initialCategories?: ParsedCategory[];
};

export default function PhotoMenuImporter({ userId, initialCategories }: PhotoMenuImporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [categories, setCategories] = useState<ParsedCategory[] | null>(initialCategories ?? null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateDish = (catIdx: number, dishIdx: number, field: 'name' | 'price', value: string) => {
    setCategories((prev) => {
      if (!prev) return prev;
      const next = prev.map((cat, ci) =>
        ci !== catIdx
          ? cat
          : {
              ...cat,
              dishes: cat.dishes.map((dish, di) =>
                di !== dishIdx
                  ? dish
                  : { ...dish, [field]: field === 'price' ? parseFloat(value) || 0 : value }
              ),
            }
      );
      return next;
    });
  };

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    setError(null);
    setIsParsing(true);
    setCategories(null);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await parseMenuFromPhoto(base64);
      if (result?.categories?.length) {
        setCategories(result.categories);
      } else {
        setError('Could not extract menu items from this image. Try a clearer photo.');
      }
    } catch {
      setError('Failed to parse menu photo. Please try again.');
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleImportAll = async () => {
    if (!categories) return;
    setIsImporting(true);
    setError(null);
    try {
      await postBulkDishes(userId, categories);
      setCategories(null);
      setIsOpen(false);
    } catch {
      setError('Failed to import dishes. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const totalDishes = categories?.reduce((sum, cat) => sum + cat.dishes.length, 0) ?? 0;

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
      >
        Import from photo
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">Import Menu from Photo</h3>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setCategories(null);
            setError(null);
          }}
          className="text-gray-400 hover:text-gray-500 text-sm"
        >
          Close
        </button>
      </div>

      {!categories && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-indigo-400 transition-colors"
        >
          {isParsing ? (
            <p className="text-sm text-gray-500">Analyzing menu photo...</p>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop a menu photo here, or
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Select file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {categories && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-3">
            Found {totalDishes} dish{totalDishes !== 1 ? 'es' : ''} in {categories.length}{' '}
            categor{categories.length !== 1 ? 'ies' : 'y'} — edit before importing
          </p>
          <div className="max-h-80 overflow-y-auto space-y-4">
            {categories.map((cat, catIdx) => (
              <div key={catIdx}>
                <h4 className="text-sm font-medium text-gray-900 mb-2">{cat.name}</h4>
                <ul className="space-y-2">
                  {cat.dishes.map((dish, dishIdx) => (
                    <li key={dishIdx} className="flex items-center gap-2 pl-3">
                      <input
                        type="text"
                        data-field="name"
                        value={dish.name}
                        onChange={(e) => updateDish(catIdx, dishIdx, 'name', e.target.value)}
                        className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                      <input
                        type="number"
                        data-field="price"
                        value={dish.price}
                        min={0}
                        step={0.01}
                        onChange={(e) => updateDish(catIdx, dishIdx, 'price', e.target.value)}
                        className="w-20 rounded border border-gray-200 px-2 py-1 text-sm text-gray-500 text-right focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={handleImportAll}
              disabled={isImporting}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
            >
              {isImporting ? 'Importing...' : 'Import all'}
            </button>
            <button
              type="button"
              onClick={() => {
                setCategories(null);
                setError(null);
              }}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
cd apps/menu-go && pnpm test -- --testPathPattern=photo-menu-importer
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/menu-go/src/components/PhotoMenuImporter/index.tsx apps/menu-go/__test__/photo-menu-importer.test.tsx
git commit -m "feat: add inline name/price editing to photo import preview"
```

---

## Task 3: Branding colors — schema migration

**Files:**
- Modify: `packages/db/prisma/schema.prisma`

- [ ] **Step 1: Add color fields to `ConfigRestaurant`**

In `packages/db/prisma/schema.prisma`, add two lines inside the `ConfigRestaurant` model after the `cuisineType` field:

```prisma
  primaryColor    String?  @default("#4F46E5")
  backgroundColor String?  @default("#FFFFFF")
```

The model should now look like:

```prisma
model ConfigRestaurant {
  id              String      @id @default(uuid())
  name            String?
  slug            String?     @unique
  address         String?
  phone           String?
  image           String?
  logoUrl         String?
  cuisineType     String?
  primaryColor    String?     @default("#4F46E5")
  backgroundColor String?     @default("#FFFFFF")
  qrCode          String?
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  Dishes          Dishes[]
  Category        Category[]
  MenuView        MenuView[]
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}
```

- [ ] **Step 2: Push migration and regenerate client**

```bash
cd /Users/edselserrano/Projects/personal/menu-go-frontend && pnpm db:push
```

Expected: Output ends with `Your database is now in sync with your schema.` and `Generated Prisma Client`.

- [ ] **Step 3: Commit**

```bash
git add packages/db/prisma/schema.prisma
git commit -m "feat: add primaryColor and backgroundColor to ConfigRestaurant schema"
```

---

## Task 4: Branding colors — server action

**Files:**
- Modify: `apps/menu-go/src/app/actions.ts`

- [ ] **Step 1: Extend `Restaurant` type**

In `actions.ts`, update the `Restaurant` type (around line 31) to include the two new fields:

```typescript
export type Restaurant = {
  name: string | null;
  address: string | null;
  phone: string | null;
  id: string | null;
  slug: string | null;
  qrCode: string | null;
  cuisineType: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  backgroundColor: string | null;
};
```

- [ ] **Step 2: Extend `postRestaurantSchema`**

Update the `postRestaurantSchema` Zod object (around line 23) to include the color fields:

```typescript
const postRestaurantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required'),
  cuisineType: z.string().optional().default(''),
  userId: z.string().min(1, 'User ID is required'),
  primaryColor: z.string().optional().default('#4F46E5'),
  backgroundColor: z.string().optional().default('#FFFFFF'),
});
```

- [ ] **Step 3: Pass colors through `postRestaurant`**

In `postRestaurant`, destructure the new fields and include them in Prisma calls.

Replace the destructuring line (around line 137):

```typescript
const { name, address, phone, cuisineType, userId, primaryColor, backgroundColor } = parsed.data;
```

In the `create` call (restaurant creation branch), add both fields:

```typescript
const restaurant = await prisma.configRestaurant.create({
  data: { name, userId, address, phone, slug, cuisineType, primaryColor, backgroundColor },
});
```

In the `update` call (restaurant update branch), add them to `updateData`:

```typescript
const updateData: any = { name, address, phone, primaryColor, backgroundColor };
```

- [ ] **Step 4: Extend `getRestaurant` return**

Update the `getRestaurant` function return object to include the new fields:

```typescript
return {
  name: existConfig.name,
  address: existConfig.address,
  phone: existConfig.phone,
  qrCode: existConfig.qrCode,
  id: existConfig.id,
  slug: existConfig.slug,
  cuisineType: existConfig.cuisineType,
  logoUrl: existConfig.logoUrl,
  primaryColor: existConfig.primaryColor,
  backgroundColor: existConfig.backgroundColor,
};
```

- [ ] **Step 5: Run existing action tests**

```bash
cd apps/menu-go && pnpm test -- --testPathPattern=actions.test
```

Expected: All tests pass (no behavior changed, only additions).

- [ ] **Step 6: Commit**

```bash
git add apps/menu-go/src/app/actions.ts
git commit -m "feat: extend postRestaurant and getRestaurant with branding colors"
```

---

## Task 5: Branding colors — admin form

**Files:**
- Modify: `apps/menu-go/src/components/Forms/index.tsx`

- [ ] **Step 1: Add color pickers to the form**

In `apps/menu-go/src/components/Forms/index.tsx`:

1. Add `primaryColor` and `backgroundColor` to the `restaurantD` display (these come from the `Restaurant` type already extended in Task 4).

2. After the `phone` field block (around line 147, before the `{restaurantD && (...)}`  conditional block), add the two color picker fields:

```tsx
<div className="sm:col-span-3">
  <label
    htmlFor="primaryColor"
    className="block text-sm font-medium leading-6 text-gray-900"
  >
    Primary color
  </label>
  <div className="mt-2 flex items-center gap-3">
    <input
      type="color"
      name="primaryColor"
      id="primaryColor"
      defaultValue={restaurantD?.primaryColor || '#4F46E5'}
      className="h-9 w-16 cursor-pointer rounded border border-gray-300 p-0.5"
    />
    <span className="text-sm text-gray-500">Used for accents and buttons</span>
  </div>
</div>

<div className="sm:col-span-3">
  <label
    htmlFor="backgroundColor"
    className="block text-sm font-medium leading-6 text-gray-900"
  >
    Background color
  </label>
  <div className="mt-2 flex items-center gap-3">
    <input
      type="color"
      name="backgroundColor"
      id="backgroundColor"
      defaultValue={restaurantD?.backgroundColor || '#FFFFFF'}
      className="h-9 w-16 cursor-pointer rounded border border-gray-300 p-0.5"
    />
    <span className="text-sm text-gray-500">Menu page background</span>
  </div>
</div>
```

- [ ] **Step 2: Build check**

```bash
cd /Users/edselserrano/Projects/personal/menu-go-frontend && pnpm build 2>&1 | tail -20
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add apps/menu-go/src/components/Forms/index.tsx
git commit -m "feat: add primary and background color pickers to restaurant config form"
```

---

## Task 6: Branding colors — public menu

**Files:**
- Modify: `apps/menu-go/src/components/Menu/index.tsx`
- Modify: `apps/menu-go/src/components/Menu/dish.tsx`

- [ ] **Step 1: Apply CSS custom properties in `Menu/index.tsx`**

Replace the `Menu` component in `apps/menu-go/src/components/Menu/index.tsx`:

```typescript
import Category from './category';
import Banner from './restaurant-banner';
import UserNoAuth from './user-no-auth';

export default function Menu({ dishes, restaurant }) {
  const groupByCategory = dishes.reduce((acumulador, elemento) => {
    if (acumulador[elemento.category.name]) {
      acumulador[elemento.category.name].push(elemento);
    } else {
      acumulador[elemento.category.name] = [elemento];
    }
    return acumulador;
  }, {});

  return (
    <div
      style={{
        '--color-primary': restaurant.primaryColor ?? '#4F46E5',
        '--color-bg': restaurant.backgroundColor ?? '#FFFFFF',
      } as React.CSSProperties}
      className="min-h-screen"
      style={{ backgroundColor: restaurant.backgroundColor ?? '#FFFFFF' }}
    >
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-12 lg:max-w-7xl lg:px-8">
        <Banner restaurant={restaurant} />
        <UserNoAuth />

        {Object.entries(groupByCategory).map(([key, value]) => (
          <Category key={key} category={value} name={key} />
        ))}
      </div>
    </div>
  );
}
```

Wait — two `style` props is invalid. Use one:

```typescript
import Category from './category';
import Banner from './restaurant-banner';
import UserNoAuth from './user-no-auth';

export default function Menu({ dishes, restaurant }) {
  const groupByCategory = dishes.reduce((acumulador, elemento) => {
    if (acumulador[elemento.category.name]) {
      acumulador[elemento.category.name].push(elemento);
    } else {
      acumulador[elemento.category.name] = [elemento];
    }
    return acumulador;
  }, {});

  return (
    <div
      style={
        {
          '--color-primary': restaurant.primaryColor ?? '#4F46E5',
          '--color-bg': restaurant.backgroundColor ?? '#FFFFFF',
          backgroundColor: restaurant.backgroundColor ?? '#FFFFFF',
        } as React.CSSProperties
      }
      className="min-h-screen"
    >
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-12 lg:max-w-7xl lg:px-8">
        <Banner restaurant={restaurant} />
        <UserNoAuth />

        {Object.entries(groupByCategory).map(([key, value]) => (
          <Category key={key} category={value} name={key} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update price color in `Menu/dish.tsx`**

In `apps/menu-go/src/components/Menu/dish.tsx`, change the price `<span>` from hardcoded `text-indigo-600` to use the CSS variable:

```tsx
<span
  className="text-base font-bold whitespace-nowrap"
  style={{ color: 'var(--color-primary, #4F46E5)' }}
>
  ${dish.price?.toFixed(2)}
</span>
```

- [ ] **Step 3: Build check**

```bash
cd /Users/edselserrano/Projects/personal/menu-go-frontend && pnpm build 2>&1 | tail -20
```

Expected: Clean build, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add apps/menu-go/src/components/Menu/index.tsx apps/menu-go/src/components/Menu/dish.tsx
git commit -m "feat: apply restaurant branding colors to public menu page"
```

---

## Task 7: `/r/{slug}` canonical public URL

**Files:**
- Create: `apps/menu-go/src/app/r/[slug]/page.tsx`
- Create: `apps/menu-go/src/app/r/[slug]/error.tsx`
- Create: `apps/menu-go/src/app/r/[slug]/loading.tsx`
- Modify: `apps/menu-go/src/app/menu/[slug]/page.tsx`
- Modify: `apps/menu-go/src/app/actions.ts`
- Modify: `apps/menu-go/src/components/Forms/index.tsx`

- [ ] **Step 1: Create the new route `r/[slug]/page.tsx`**

Create `apps/menu-go/src/app/r/[slug]/page.tsx`:

```typescript
import type { Metadata } from 'next';

import Menu from '../../../components/Menu';
import { getMenuBySlug, trackMenuView } from '../../actions';

export const metadata: Metadata = {
  title: 'Menu',
  description: 'Menu',
};

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ src?: string }>;
}) {
  const { slug } = await params;
  const { src } = await searchParams;
  const restaurant = await getMenuBySlug(slug);

  trackMenuView(restaurant.id, src === 'qr' ? 'qr' : 'direct').catch(() => {});

  return <Menu dishes={restaurant.Dishes} restaurant={restaurant} />;
}
```

- [ ] **Step 2: Create `r/[slug]/error.tsx`**

Create `apps/menu-go/src/app/r/[slug]/error.tsx`:

```typescript
'use client';

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-gray-600">Menu not found.</p>
      <button
        onClick={reset}
        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        Try again
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create `r/[slug]/loading.tsx`**

Create `apps/menu-go/src/app/r/[slug]/loading.tsx`:

```typescript
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-400">Loading menu…</p>
    </div>
  );
}
```

- [ ] **Step 4: Replace `/menu/[slug]/page.tsx` with redirect**

Replace the full content of `apps/menu-go/src/app/menu/[slug]/page.tsx`:

```typescript
import { permanentRedirect } from 'next/navigation';

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/r/${slug}`);
}
```

- [ ] **Step 5: Update QR URL in `postRestaurant` to point to `/r/`**

In `apps/menu-go/src/app/actions.ts`, in the `postRestaurant` function, find the QR URL generation (around line 162):

```typescript
const menuUrl = `${siteUrl}/menu/${slug || restaurant.id}`;
```

Replace with:

```typescript
const menuUrl = `${siteUrl}/r/${slug || restaurant.id}`;
```

- [ ] **Step 6: Update URL display in `Forms/index.tsx` to show `/r/` path**

In `apps/menu-go/src/components/Forms/index.tsx`, find the two URL display occurrences (the `<a>` tag and the share buttons) that currently use `/menu/${restaurantD?.id}` and update them to use the slug with the `/r/` path.

Replace all instances of:
```typescript
`${process.env.NEXT_PUBLIC_SITE_URL}/menu/${restaurantD?.id}`
```

With:
```typescript
`${process.env.NEXT_PUBLIC_SITE_URL}/r/${restaurantD?.slug || restaurantD?.id}`
```

There are 4 occurrences in the file (the href `<a>`, the link text, and three share button URLs). Update all four.

- [ ] **Step 7: Build check**

```bash
cd /Users/edselserrano/Projects/personal/menu-go-frontend && pnpm build 2>&1 | tail -20
```

Expected: Clean build.

- [ ] **Step 8: Run full test suite**

```bash
cd /Users/edselserrano/Projects/personal/menu-go-frontend && pnpm test
```

Expected: All tests pass.

- [ ] **Step 9: Commit**

```bash
git add apps/menu-go/src/app/r/ apps/menu-go/src/app/menu/[slug]/page.tsx apps/menu-go/src/app/actions.ts apps/menu-go/src/components/Forms/index.tsx
git commit -m "feat: add /r/{slug} canonical route and redirect from /menu/{slug}"
```

---

## Manual Smoke Test Checklist

After all tasks complete, verify end-to-end in `pnpm dev`:

- [ ] Upload a menu photo in `/panel` → parsed categories appear with editable name/price inputs → edit a value → click "Import all" → dishes appear with the edited values
- [ ] In restaurant config, set a primary color (e.g. red `#DC2626`) and background (e.g. light yellow `#FEFCE8`), save → visit `/r/{your-slug}` → page background is yellow, price text is red
- [ ] Visit `/menu/{your-slug}` in browser → browser redirects to `/r/{your-slug}` with 308 status
- [ ] Create a new restaurant → download QR → QR URL points to `/r/{slug}` not `/menu/`
