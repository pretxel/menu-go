import sitemap from '../src/app/sitemap';
import { resetDb } from './helpers/supabase-fake';

jest.mock('../src/lib/supabase', () => require('./helpers/supabase-fake').moduleMock());

describe('sitemap', () => {
  it('includes marketing URLs + every restaurant slug', async () => {
    const updated = '2026-05-01T00:00:00.000Z';
    resetDb({
      mg_config_restaurant: [
        { userId: 'u1', slug: 'alpha', updatedAt: updated },
        { userId: 'u2', slug: 'beta', updatedAt: updated },
      ],
    });

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
    expect(alpha.lastModified).toEqual(new Date(updated));
    expect(alpha.changeFrequency).toBe('weekly');
    expect(alpha.priority).toBe(0.7);
  });

  it('lists only slugged restaurants', async () => {
    resetDb({
      mg_config_restaurant: [
        { userId: 'u1', slug: 'alpha' },
        { userId: 'u2', slug: null },
      ],
    });
    const result = await sitemap();
    const restaurantUrls = result.filter((r) => r.url.includes('/r/'));
    expect(restaurantUrls).toHaveLength(1);
    expect(restaurantUrls[0].url).toContain('/r/alpha');
  });
});
