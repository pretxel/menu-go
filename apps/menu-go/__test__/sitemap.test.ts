import sitemap from '../src/app/sitemap';
import prisma from '../src/lib/prisma';

jest.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    configRestaurant: { findMany: jest.fn() },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any;

describe('sitemap', () => {
  beforeEach(() => jest.clearAllMocks());

  it('includes marketing URLs + every restaurant slug', async () => {
    const updated = new Date('2026-05-01');
    mockPrisma.configRestaurant.findMany.mockResolvedValue([
      { slug: 'alpha', updatedAt: updated },
      { slug: 'beta', updatedAt: updated },
    ]);

    const result = await sitemap();
    const urls = result.map((r) => r.url);

    expect(urls).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/\/$/),
        expect.stringContaining('/learn'),
        expect.stringContaining('/privacy'),
        expect.stringContaining('/r/alpha'),
        expect.stringContaining('/r/beta'),
      ]),
    );

    const alpha = result.find((r) => r.url.endsWith('/r/alpha'))!;
    expect(alpha.lastModified).toEqual(updated);
    expect(alpha.changeFrequency).toBe('weekly');
    expect(alpha.priority).toBe(0.7);
  });

  it('queries only slugged restaurants', async () => {
    mockPrisma.configRestaurant.findMany.mockResolvedValue([]);
    await sitemap();
    expect(mockPrisma.configRestaurant.findMany).toHaveBeenCalledWith({
      where: { slug: { not: null } },
      select: { slug: true, updatedAt: true },
    });
  });
});
