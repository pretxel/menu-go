// Mock 'use server' directive dependencies
import Anthropic from '@anthropic-ai/sdk';
import { getServerSession } from 'next-auth';

import {
  getAllCategories,
  getMenu,
  getMenuBySlug,
  getOnboardingStatus,
  parseMenuFromPhoto,
  postDish,
  trackMenuView,
} from '../src/app/actions';
import { db, failNext, resetDb } from './helpers/supabase-fake';

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
}));

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({}));
});

jest.mock('@anthropic-ai/sdk', () => {
  const mockCreate = jest.fn();
  const MockAnthropic = jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  }));
  // Expose the shared mockCreate so tests can configure it
  (MockAnthropic as any)._mockCreate = mockCreate;
  return MockAnthropic;
});

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(),
}));

// Mock next-auth so the real package (which transitively imports ESM `jose`) is never resolved
jest.mock('next-auth', () => ({
  __esModule: true,
  getServerSession: jest.fn(),
}));

// Mock the local auth module so its imports (which would pull next-auth providers) are bypassed
jest.mock('../src/lib/auth', () => ({
  authOptions: {},
}));

// Mock zod to control safeParse behavior and avoid ESM/CJS interop issues in Jest
jest.mock('zod', () => {
  const createChainable = (): any => {
    const chain: any = () => chain;
    chain.min = () => chain;
    chain.max = () => chain;
    chain.refine = () => chain;
    chain.optional = () => chain;
    chain.default = () => chain;
    chain.transform = () => chain;
    chain.array = () => chain;
    chain.split = () => chain;
    chain.filter = () => chain;
    chain.nullable = () => chain;
    chain.uuid = () => chain;
    chain.email = () => chain;
    chain.url = () => chain;
    chain.regex = () => chain;
    return chain;
  };

  const z = {
    object: (_shape: any) => ({
      safeParse: (data: any) => ({ success: true, data }),
    }),
    string: createChainable,
    number: createChainable,
    boolean: createChainable,
    array: createChainable,
    enum: createChainable,
    preprocess: (_fn: any, _schema: any) => createChainable(),
  };

  return { z };
});

jest.mock('../src/lib/supabase', () => require('./helpers/supabase-fake').moduleMock());

const mockSession = getServerSession as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  resetDb();
});

function seedMenu() {
  resetDb({
    mg_user: [{ id: 'user-1', email: 'u1@example.com' }],
    mg_config_restaurant: [
      { id: 'rest-1', userId: 'user-1', name: 'Test Restaurant', slug: 'test-restaurant' },
    ],
    mg_category: [{ id: 'c1', name: 'Mains', description: 'Mains', configRestaurantId: 'rest-1' }],
    mg_dishes: [
      { id: 'd1', name: 'Available Dish', price: 10, isAvailable: true, configRestaurantId: 'rest-1', categoryId: 'c1' },
      { id: 'd2', name: 'Sold Out Dish', price: 12, isAvailable: false, configRestaurantId: 'rest-1', categoryId: 'c1' },
    ],
  });
}

describe('getMenu', () => {
  it('returns restaurant with only available dishes, each with its category', async () => {
    seedMenu();

    const result = await getMenu('rest-1');

    expect(result.id).toBe('rest-1');
    expect(result.name).toBe('Test Restaurant');
    expect(result.Dishes).toHaveLength(1);
    expect(result.Dishes[0].name).toBe('Available Dish');
    expect(result.Dishes[0].category).toEqual(expect.objectContaining({ id: 'c1', name: 'Mains' }));
  });

  it('throws error when restaurant not found', async () => {
    await expect(getMenu('nonexistent')).rejects.toThrow('No restaurant found');
  });
});

describe('getMenuBySlug', () => {
  it('finds restaurant by slug', async () => {
    seedMenu();

    const result = await getMenuBySlug('test-restaurant');

    expect(result.id).toBe('rest-1');
    expect(result.Dishes.map((d) => d.id)).toEqual(['d1']);
  });

  it('falls back to getMenu (by ID) when slug not found', async () => {
    seedMenu();

    const result = await getMenuBySlug('rest-1');

    expect(result.id).toBe('rest-1');
    const lookups = db.log.filter((q) => q.table === 'mg_config_restaurant').map((q) => q.filters);
    expect(lookups).toEqual([['slug=eq.rest-1'], ['id=eq.rest-1']]);
  });
});

describe('getAllCategories', () => {
  const categories = [
    { id: 'c1', name: 'Mains', description: '', configRestaurantId: 'rest-1' },
    { id: 'c2', name: 'Global', description: '', configRestaurantId: null },
    { id: 'c3', name: 'Other tenant', description: '', configRestaurantId: 'rest-2' },
  ];

  it('returns [] when no session', async () => {
    mockSession.mockResolvedValue(null);
    const result = await getAllCategories();
    expect(result).toEqual([]);
    expect(db.log.some((q) => q.table === 'mg_category')).toBe(false);
  });

  it('returns own + global categories when session+restaurant exist', async () => {
    resetDb({
      mg_config_restaurant: [
        { id: 'rest-1', userId: 'user-1' },
        { id: 'rest-2', userId: 'user-2' },
      ],
      mg_category: categories,
    });
    mockSession.mockResolvedValue({ user: { id: 'user-1' } });

    const result = await getAllCategories();

    expect(result.map((c) => c.id).sort()).toEqual(['c1', 'c2']);
  });

  it('returns only global categories when session has no restaurant', async () => {
    resetDb({ mg_category: categories });
    mockSession.mockResolvedValue({ user: { id: 'user-1' } });

    const result = await getAllCategories();

    expect(result.map((c) => c.id)).toEqual(['c2']);
  });
});

describe('trackMenuView', () => {
  beforeEach(() => resetDb({ mg_config_restaurant: [{ id: 'rest-1', userId: 'user-1' }] }));

  it('creates a MenuView record with source', async () => {
    await trackMenuView('rest-1', 'qr');

    expect(db.tables.mg_menu_view).toEqual([
      expect.objectContaining({ configRestaurantId: 'rest-1', source: 'qr' }),
    ]);
  });

  it('defaults source to "direct"', async () => {
    await trackMenuView('rest-1');

    expect(db.tables.mg_menu_view[0]).toEqual(
      expect.objectContaining({ configRestaurantId: 'rest-1', source: 'direct' }),
    );
  });

  it('does not throw on failure (non-critical)', async () => {
    failNext('mg_menu_view');

    await expect(trackMenuView('rest-1')).resolves.toBeUndefined();
    expect(db.tables.mg_menu_view).toHaveLength(0);
  });
});

describe('parseMenuFromPhoto', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockCreate: jest.Mock = (Anthropic as any)._mockCreate;

  beforeEach(() => {
    mockCreate.mockReset();
    mockSession.mockResolvedValue({ user: { id: 'user-1' } });
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

describe('getOnboardingStatus', () => {
  it('returns false/false when no session', async () => {
    mockSession.mockResolvedValue(null);
    const result = await getOnboardingStatus();
    expect(result).toEqual({ hasCategory: false, hasDish: false });
  });

  it('returns false/false when session has no restaurant', async () => {
    mockSession.mockResolvedValue({ user: { id: 'user-no-restaurant' } });

    const result = await getOnboardingStatus();
    expect(result).toEqual({ hasCategory: false, hasDish: false });
  });

  it('returns hasCategory:false and hasDish:false when counts are 0', async () => {
    resetDb({ mg_config_restaurant: [{ id: 'rest-1', userId: 'user-1' }] });
    mockSession.mockResolvedValue({ user: { id: 'user-1' } });

    const result = await getOnboardingStatus();
    expect(result).toEqual({ hasCategory: false, hasDish: false });
  });

  it('returns hasCategory:true when the restaurant has a category', async () => {
    resetDb({
      mg_config_restaurant: [{ id: 'rest-1', userId: 'user-1' }],
      mg_category: [{ id: 'c1', name: 'A', description: '', configRestaurantId: 'rest-1' }],
    });
    mockSession.mockResolvedValue({ user: { id: 'user-1' } });

    const result = await getOnboardingStatus();
    expect(result).toEqual({ hasCategory: true, hasDish: false });
  });

  it('returns hasDish:true when the restaurant has a dish', async () => {
    seedMenu();
    mockSession.mockResolvedValue({ user: { id: 'user-1' } });

    const result = await getOnboardingStatus();
    expect(result).toEqual({ hasCategory: true, hasDish: true });
  });

  it('counts only rows of the user\'s restaurant', async () => {
    resetDb({
      mg_config_restaurant: [
        { id: 'rest-42', userId: 'user-1' },
        { id: 'rest-other', userId: 'user-2' },
      ],
      mg_category: [{ id: 'c1', name: 'A', description: '', configRestaurantId: 'rest-other' }],
      mg_dishes: [
        { id: 'd1', name: 'X', price: 1, configRestaurantId: 'rest-other', categoryId: 'c1' },
      ],
    });
    mockSession.mockResolvedValue({ user: { id: 'user-1' } });

    const result = await getOnboardingStatus();
    expect(result).toEqual({ hasCategory: false, hasDish: false });
  });
});

describe('postDish auth boundary', () => {
  function makeFormData(entries: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [k, v] of Object.entries(entries)) fd.append(k, v);
    return fd;
  }

  beforeEach(() => {
    resetDb({
      mg_config_restaurant: [
        { id: 'rest-real', userId: 'real-user' },
        { id: 'rest-attacker', userId: 'attacker' },
      ],
      mg_category: [{ id: 'c1', name: 'Mains', description: '', configRestaurantId: 'rest-real' }],
      mg_dishes: [
        { id: 'someone-elses-dish', name: 'Theirs', price: 3, configRestaurantId: 'rest-attacker', categoryId: 'c1' },
      ],
    });
  });

  it('returns requiresAuth when no session', async () => {
    mockSession.mockResolvedValue(null);
    const fd = makeFormData({
      name: 'Pizza',
      price: '10',
      categoryId: 'c1',
    });
    const res = await postDish({ message: null }, fd);
    expect(res.requiresAuth).toBe(true);
    expect(res.message).toBe('Sign in required.');
    expect(db.tables.mg_dishes).toHaveLength(1);
  });

  it('ignores form-supplied userId and uses session.user.id', async () => {
    mockSession.mockResolvedValue({ user: { id: 'real-user' } });

    const fd = makeFormData({
      name: 'Burger',
      price: '12',
      categoryId: 'c1',
      userId: 'attacker',
    });
    await postDish({ message: null }, fd);

    const created = db.tables.mg_dishes.find((d) => d.name === 'Burger');
    expect(created).toEqual(expect.objectContaining({ configRestaurantId: 'rest-real', price: 12 }));
  });

  it('rejects cross-tenant dishId on update', async () => {
    mockSession.mockResolvedValue({ user: { id: 'real-user' } });

    const fd = makeFormData({
      name: 'Hijack',
      price: '5',
      categoryId: 'c1',
      dishId: 'someone-elses-dish',
    });
    const res = await postDish({ message: null }, fd);

    expect(res.message).toBe('Dish not found.');
    expect(db.tables.mg_dishes.find((d) => d.id === 'someone-elses-dish')?.name).toBe('Theirs');
  });
});
