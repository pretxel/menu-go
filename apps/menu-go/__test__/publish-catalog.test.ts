// Mock 'use server' directive dependencies (same setup as actions.test.ts)
import { getServerSession } from 'next-auth';
import QRCode from 'qrcode';

import { publishCatalog } from '../src/app/actions';
import prisma from '../src/lib/prisma';

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

jest.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    configRestaurant: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    dishes: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any;
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

beforeEach(() => {
  jest.clearAllMocks();
  // tx client is the same mock — run transaction callbacks against it
  mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
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
    expect(mockPrisma.configRestaurant.create).not.toHaveBeenCalled();
    expect(mockPrisma.dishes.create).not.toHaveBeenCalled();
  });

  it('first-time publish creates restaurant with slug + QR and imports dishes', async () => {
    mockSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockPrisma.configRestaurant.findFirst
      .mockResolvedValueOnce(null) // no restaurant for user
      .mockResolvedValueOnce(null); // slug not taken
    mockPrisma.configRestaurant.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'rest-1', ...data }),
    );
    mockPrisma.category.findFirst.mockResolvedValue(null);
    mockPrisma.category.create.mockResolvedValue({ id: 'cat-1', name: 'Starters' });
    mockPrisma.dishes.create.mockResolvedValue({ id: 'dish-x' });

    const res = await publishCatalog({
      restaurant: { name: 'Casa Edsel', address: '123 Main St', phone: '555-1234' },
      categories: sampleCategories,
    });

    // QR encodes an absolute URL to the public page
    expect(mockToDataURL).toHaveBeenCalledWith('http://localhost:3000/r/casa-edsel');
    expect(mockPrisma.configRestaurant.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Casa Edsel',
        userId: 'user-1',
        slug: 'casa-edsel',
        qrCode: 'data:image/png;base64,QR',
      }),
    });
    expect(mockPrisma.dishes.create).toHaveBeenCalledTimes(2);
    expect(res.data).toEqual({
      slug: 'casa-edsel',
      qrCode: 'data:image/png;base64,QR',
      menuUrl: 'http://localhost:3000/r/casa-edsel',
    });
  });

  it('publishes with name only — address and phone default to empty strings', async () => {
    mockSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockPrisma.configRestaurant.findFirst.mockResolvedValue(null);
    mockPrisma.configRestaurant.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'rest-1', ...data }),
    );
    mockPrisma.category.findFirst.mockResolvedValue(null);
    mockPrisma.category.create.mockResolvedValue({ id: 'cat-1' });

    const res = await publishCatalog({
      restaurant: { name: 'Solo Name' },
      categories: [],
    } as any);

    expect(mockPrisma.configRestaurant.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: 'Solo Name', address: '', phone: '' }),
    });
    expect(res.message).toBe('Catalog published!');
  });

  it('reuses an existing restaurant — no duplicate slug/QR, dishes imported into it', async () => {
    mockSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockPrisma.configRestaurant.findFirst.mockResolvedValue({
      id: 'rest-1',
      slug: 'existing-slug',
      qrCode: 'data:image/png;base64,EXISTING',
    });
    mockPrisma.category.findFirst.mockResolvedValue(null);
    mockPrisma.category.create.mockResolvedValue({ id: 'cat-1' });
    mockPrisma.dishes.create.mockResolvedValue({ id: 'dish-x' });

    const res = await publishCatalog({
      restaurant: { name: 'Ignored New Name', address: '', phone: '' },
      categories: sampleCategories,
    });

    expect(mockPrisma.configRestaurant.create).not.toHaveBeenCalled();
    expect(mockToDataURL).not.toHaveBeenCalled();
    expect(mockPrisma.dishes.create).toHaveBeenCalledTimes(2);
    expect(res.data).toEqual({
      slug: 'existing-slug',
      qrCode: 'data:image/png;base64,EXISTING',
      menuUrl: 'http://localhost:3000/r/existing-slug',
    });
  });

  it('reuses same-name categories instead of duplicating them', async () => {
    mockSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockPrisma.configRestaurant.findFirst.mockResolvedValue({
      id: 'rest-1',
      slug: 'existing-slug',
      qrCode: 'data:image/png;base64,EXISTING',
    });
    mockPrisma.category.findFirst.mockResolvedValue({ id: 'cat-existing', name: 'Starters' });

    await publishCatalog({
      restaurant: { name: 'X', address: '', phone: '' },
      categories: sampleCategories,
    });

    expect(mockPrisma.category.create).not.toHaveBeenCalled();
    expect(mockPrisma.dishes.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ categoryId: 'cat-existing' }),
      }),
    );
  });

  it('backfills a QR code for an existing restaurant that has none', async () => {
    mockSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockPrisma.configRestaurant.findFirst.mockResolvedValue({
      id: 'rest-1',
      slug: 'existing-slug',
      qrCode: null,
    });
    mockPrisma.configRestaurant.update.mockResolvedValue({
      id: 'rest-1',
      slug: 'existing-slug',
      qrCode: 'data:image/png;base64,QR',
    });
    mockPrisma.category.findFirst.mockResolvedValue({ id: 'cat-1' });

    const res = await publishCatalog({
      restaurant: { name: 'X', address: '', phone: '' },
      categories: sampleCategories,
    });

    expect(mockToDataURL).toHaveBeenCalledWith('http://localhost:3000/r/existing-slug');
    expect(mockPrisma.configRestaurant.update).toHaveBeenCalledWith({
      where: { id: 'rest-1' },
      data: { qrCode: 'data:image/png;base64,QR' },
    });
    expect(res.data?.qrCode).toBe('data:image/png;base64,QR');
  });
});
