// Mock 'use server' directive dependencies (same setup as actions.test.ts)
import { getServerSession } from 'next-auth';
import QRCode from 'qrcode';

import { publishCatalog } from '../src/app/actions';
import { db, resetDb } from './helpers/supabase-fake';

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
  const MockAnthropic = jest.fn().mockImplementation(() => ({
    messages: { create: jest.fn() },
  }));
  return MockAnthropic;
});

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(),
}));

jest.mock('next-auth', () => ({
  __esModule: true,
  getServerSession: jest.fn(),
}));

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
    chain.nullable = () => chain;
    chain.uuid = () => chain;
    chain.catch = () => chain;
    return chain;
  };

  const z = {
    object: () => {
      const obj: any = {
        safeParse: (data: any) => ({ success: true, data }),
      };
      obj.optional = () => obj;
      obj.default = () => obj;
      return obj;
    },
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
const mockToDataURL = QRCode.toDataURL as jest.Mock;

const sampleCategories = [
  {
    name: 'Starters',
    dishes: [
      { name: 'Nachos', description: 'With cheese', price: 8.5, tags: ['vegetarian'] },
      { name: 'Wings', description: '', price: 10, tags: [] },
    ],
  },
];

const existingRestaurant = {
  id: 'rest-1',
  userId: 'user-1',
  name: 'Existing',
  slug: 'existing-slug',
  qrCode: 'data:image/png;base64,EXISTING',
};

beforeEach(() => {
  jest.clearAllMocks();
  resetDb({ mg_user: [{ id: 'user-1', email: 'u1@example.com' }] });
  mockToDataURL.mockResolvedValue('data:image/png;base64,QR');
});

describe('publishCatalog', () => {
  it('rejects unauthenticated calls and creates nothing', async () => {
    mockSession.mockResolvedValue(null);

    const res = await publishCatalog({
      restaurant: { name: 'Casa Edsel', address: '', phone: '' },
      categories: sampleCategories,
    });

    expect(res.requiresAuth).toBe(true);
    expect(res.message).toBe('Sign in required.');
    expect(db.tables.mg_config_restaurant).toHaveLength(0);
    expect(db.tables.mg_dishes).toHaveLength(0);
  });

  it('first-time publish creates restaurant with slug + QR and imports dishes', async () => {
    mockSession.mockResolvedValue({ user: { id: 'user-1' } });

    const res = await publishCatalog({
      restaurant: { name: 'Casa Edsel', address: '123 Main St', phone: '555-1234' },
      categories: sampleCategories,
    });

    // QR encodes an absolute URL to the public page
    expect(mockToDataURL).toHaveBeenCalledWith('http://localhost:3000/r/casa-edsel');
    expect(db.tables.mg_config_restaurant).toEqual([
      expect.objectContaining({
        name: 'Casa Edsel',
        userId: 'user-1',
        address: '123 Main St',
        phone: '555-1234',
        slug: 'casa-edsel',
        qrCode: 'data:image/png;base64,QR',
      }),
    ]);
    const restaurantId = db.tables.mg_config_restaurant[0].id;
    expect(db.tables.mg_category).toEqual([
      expect.objectContaining({ name: 'Starters', configRestaurantId: restaurantId }),
    ]);
    expect(db.tables.mg_dishes).toHaveLength(2);
    expect(db.tables.mg_dishes[0]).toEqual(
      expect.objectContaining({ name: 'Nachos', price: 8.5, tags: ['vegetarian'], configRestaurantId: restaurantId }),
    );
    expect(res.data).toEqual({
      slug: 'casa-edsel',
      qrCode: 'data:image/png;base64,QR',
      menuUrl: 'http://localhost:3000/r/casa-edsel',
    });
  });

  it('suffixes the slug when another restaurant already uses it', async () => {
    mockSession.mockResolvedValue({ user: { id: 'user-1' } });
    db.tables.mg_config_restaurant.push({ id: 'other', userId: 'user-2', slug: 'casa-edsel' });

    const res = await publishCatalog({
      restaurant: { name: 'Casa Edsel', address: '', phone: '' },
      categories: [],
    });

    expect(res.data?.slug).toMatch(/^casa-edsel-\d+$/);
  });

  it('publishes with name only — address and phone default to empty strings', async () => {
    mockSession.mockResolvedValue({ user: { id: 'user-1' } });

    const res = await publishCatalog({
      restaurant: { name: 'Solo Name' },
      categories: [],
    } as any);

    expect(db.tables.mg_config_restaurant[0]).toEqual(
      expect.objectContaining({ name: 'Solo Name', address: '', phone: '' }),
    );
    expect(res.message).toBe('Catalog published!');
  });

  it('is atomic: a failure mid-import leaves no restaurant, category or dish', async () => {
    mockSession.mockResolvedValue({ user: { id: 'user-1' } });

    const res = await publishCatalog({
      restaurant: { name: 'Broken', address: '', phone: '' },
      categories: [
        { name: 'Starters', dishes: [{ name: 'ok', price: 1 }, { name: null as any, price: 2 }] },
      ] as any,
    });

    expect(res.message).toBe('Publish failed. Please try again.');
    expect(db.tables.mg_config_restaurant).toHaveLength(0);
    expect(db.tables.mg_category).toHaveLength(0);
    expect(db.tables.mg_dishes).toHaveLength(0);
  });

  it('reuses an existing restaurant — no duplicate slug/QR, dishes imported into it', async () => {
    mockSession.mockResolvedValue({ user: { id: 'user-1' } });
    db.tables.mg_config_restaurant.push({ ...existingRestaurant });

    const res = await publishCatalog({
      restaurant: { name: 'Ignored New Name', address: '', phone: '' },
      categories: sampleCategories,
    });

    expect(db.tables.mg_config_restaurant).toHaveLength(1);
    expect(mockToDataURL).not.toHaveBeenCalled();
    expect(db.tables.mg_dishes).toHaveLength(2);
    expect(db.tables.mg_dishes.every((d) => d.configRestaurantId === 'rest-1')).toBe(true);
    expect(res.data).toEqual({
      slug: 'existing-slug',
      qrCode: 'data:image/png;base64,EXISTING',
      menuUrl: 'http://localhost:3000/r/existing-slug',
    });
  });

  it('reuses same-name categories instead of duplicating them', async () => {
    mockSession.mockResolvedValue({ user: { id: 'user-1' } });
    db.tables.mg_config_restaurant.push({ ...existingRestaurant });
    db.tables.mg_category.push({
      id: 'cat-existing',
      name: 'Starters',
      description: 'Starters',
      configRestaurantId: 'rest-1',
    });

    await publishCatalog({
      restaurant: { name: 'X', address: '', phone: '' },
      categories: sampleCategories,
    });

    expect(db.tables.mg_category).toHaveLength(1);
    expect(db.tables.mg_dishes.every((d) => d.categoryId === 'cat-existing')).toBe(true);
  });

  it('backfills a QR code for an existing restaurant that has none', async () => {
    mockSession.mockResolvedValue({ user: { id: 'user-1' } });
    db.tables.mg_config_restaurant.push({ ...existingRestaurant, qrCode: null });

    const res = await publishCatalog({
      restaurant: { name: 'X', address: '', phone: '' },
      categories: sampleCategories,
    });

    expect(mockToDataURL).toHaveBeenCalledWith('http://localhost:3000/r/existing-slug');
    expect(db.tables.mg_config_restaurant[0].qrCode).toBe('data:image/png;base64,QR');
    expect(res.data?.qrCode).toBe('data:image/png;base64,QR');
  });
});
