import { generateMetadata } from '../src/app/r/[slug]/page';
import prisma from '../src/lib/prisma';

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

jest.mock('next/server', () => ({ after: jest.fn() }));

jest.mock('next-auth', () => ({
  __esModule: true,
  getServerSession: jest.fn(),
}));

jest.mock('../src/lib/auth', () => ({ authOptions: {} }));

jest.mock('@vercel/blob', () => ({ put: jest.fn() }));

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({}));
});

jest.mock('@anthropic-ai/sdk', () => {
  const MockAnthropic = jest.fn().mockImplementation(() => ({
    messages: { create: jest.fn() },
  }));
  return MockAnthropic;
});

jest.mock('qrcode', () => ({ toDataURL: jest.fn() }));

jest.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    configRestaurant: { findFirst: jest.fn() },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any;

describe('/r/[slug] generateMetadata', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns not-found title when restaurant missing', async () => {
    mockPrisma.configRestaurant.findFirst.mockResolvedValue(null);
    const result = await generateMetadata({ params: Promise.resolve({ slug: 'gone' }) });
    expect(result.title).toBe('Menu not found');
  });

  it('builds canonical and OG from restaurant fields', async () => {
    mockPrisma.configRestaurant.findFirst.mockResolvedValue({
      name: "Joe's Pizza",
      address: '1 Main',
      cuisineType: 'Italian',
      logoUrl: 'https://blob/x.jpg',
      slug: 'joes-pizza',
      id: 'rest-1',
    });

    const result = await generateMetadata({ params: Promise.resolve({ slug: 'joes-pizza' }) });

    expect(result.title).toBe("Joe's Pizza");
    expect(result.description).toMatch(/Italian/);
    expect(result.alternates?.canonical).toContain('/r/joes-pizza');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result.openGraph as any)?.images?.[0]?.url).toBe('https://blob/x.jpg');
  });
});
