// Mock 'use server' directive dependencies
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
    return chain;
  };

  const z = {
    object: (shape: any) => ({
      safeParse: (data: any) => ({ success: true, data }),
    }),
    string: createChainable,
    number: createChainable,
    boolean: createChainable,
    array: createChainable,
    enum: createChainable,
  };

  return { z };
});

// Mock prisma client — factory must not reference outer variables
jest.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    configRestaurant: {
      findFirst: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    menuView: {
      create: jest.fn(),
    },
  },
}));

import { getMenu, getMenuBySlug, getAllCategories, trackMenuView, parseMenuFromPhoto } from '../src/app/actions';
import prisma from '../src/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getMenu', () => {
  it('returns restaurant with only available dishes', async () => {
    const mockRestaurant = {
      id: 'rest-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      Dishes: [
        { id: 'd1', name: 'Available Dish', isAvailable: true, category: { id: 'c1', name: 'Mains' } },
      ],
    };

    mockPrisma.configRestaurant.findFirst.mockResolvedValue(mockRestaurant);

    const result = await getMenu('rest-1');

    expect(mockPrisma.configRestaurant.findFirst).toHaveBeenCalledWith({
      where: { id: 'rest-1' },
      include: { Dishes: { include: { category: true }, where: { isAvailable: true } } },
    });
    expect(result).toEqual(mockRestaurant);
    expect(result.Dishes).toHaveLength(1);
    expect(result.Dishes[0].name).toBe('Available Dish');
  });

  it('throws error when restaurant not found', async () => {
    mockPrisma.configRestaurant.findFirst.mockResolvedValue(null);

    await expect(getMenu('nonexistent')).rejects.toThrow('No restaurant found');
  });
});

describe('getMenuBySlug', () => {
  it('finds restaurant by slug', async () => {
    const mockRestaurant = {
      id: 'rest-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      Dishes: [],
    };

    mockPrisma.configRestaurant.findFirst.mockResolvedValue(mockRestaurant);

    const result = await getMenuBySlug('test-restaurant');

    expect(mockPrisma.configRestaurant.findFirst).toHaveBeenCalledWith({
      where: { slug: 'test-restaurant' },
      include: { Dishes: { include: { category: true }, where: { isAvailable: true } } },
    });
    expect(result).toEqual(mockRestaurant);
  });

  it('falls back to getMenu (by ID) when slug not found', async () => {
    // First call (by slug) returns null, second call (by ID) returns the restaurant
    const mockRestaurant = {
      id: 'rest-1',
      name: 'Test Restaurant',
      Dishes: [],
    };

    mockPrisma.configRestaurant.findFirst
      .mockResolvedValueOnce(null) // slug lookup
      .mockResolvedValueOnce(mockRestaurant); // ID fallback

    const result = await getMenuBySlug('rest-1');

    // First call: slug lookup
    expect(mockPrisma.configRestaurant.findFirst).toHaveBeenNthCalledWith(1, {
      where: { slug: 'rest-1' },
      include: { Dishes: { include: { category: true }, where: { isAvailable: true } } },
    });
    // Second call: ID fallback via getMenu
    expect(mockPrisma.configRestaurant.findFirst).toHaveBeenNthCalledWith(2, {
      where: { id: 'rest-1' },
      include: { Dishes: { include: { category: true }, where: { isAvailable: true } } },
    });
    expect(result).toEqual(mockRestaurant);
  });
});

describe('getAllCategories', () => {
  it('returns all categories when no configRestaurantId provided', async () => {
    const mockCategories = [
      { id: 'c1', name: 'Mains', description: 'Main dishes' },
      { id: 'c2', name: 'Desserts', description: 'Sweet treats' },
    ];

    mockPrisma.category.findMany.mockResolvedValue(mockCategories);

    const result = await getAllCategories();

    expect(mockPrisma.category.findMany).toHaveBeenCalledWith();
    expect(result).toEqual(mockCategories);
  });

  it('filters by configRestaurantId when provided (includes global categories)', async () => {
    const mockCategories = [
      { id: 'c1', name: 'Mains', configRestaurantId: 'rest-1' },
      { id: 'c2', name: 'Global', configRestaurantId: null },
    ];

    mockPrisma.category.findMany.mockResolvedValue(mockCategories);

    const result = await getAllCategories('rest-1');

    expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { configRestaurantId: 'rest-1' },
          { configRestaurantId: null },
        ],
      },
    });
    expect(result).toEqual(mockCategories);
  });
});

describe('trackMenuView', () => {
  it('creates a MenuView record with source', async () => {
    mockPrisma.menuView.create.mockResolvedValue({ id: 'mv-1' });

    await trackMenuView('rest-1', 'qr');

    expect(mockPrisma.menuView.create).toHaveBeenCalledWith({
      data: { configRestaurantId: 'rest-1', source: 'qr' },
    });
  });

  it('defaults source to "direct"', async () => {
    mockPrisma.menuView.create.mockResolvedValue({ id: 'mv-2' });

    await trackMenuView('rest-1');

    expect(mockPrisma.menuView.create).toHaveBeenCalledWith({
      data: { configRestaurantId: 'rest-1', source: 'direct' },
    });
  });

  it('does not throw on failure (non-critical)', async () => {
    mockPrisma.menuView.create.mockRejectedValue(new Error('DB error'));

    // Should not throw
    await expect(trackMenuView('rest-1')).resolves.toBeUndefined();
  });
});

describe('parseMenuFromPhoto', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockCreate: jest.Mock = (Anthropic as any)._mockCreate;

  beforeEach(() => {
    mockCreate.mockReset();
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
