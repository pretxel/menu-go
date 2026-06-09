import { resolveSiteUrl } from '../src/lib/site';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('resolveSiteUrl', () => {
  it('prefers NEXT_PUBLIC_SITE_URL when set', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.dineqrs.com';
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'menu-go.vercel.app';

    expect(resolveSiteUrl()).toBe('https://www.dineqrs.com');
  });

  it('falls back to the Vercel production URL with https', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'menu-go.vercel.app';

    expect(resolveSiteUrl()).toBe('https://menu-go.vercel.app');
  });

  it('falls back to localhost for local development', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;

    expect(resolveSiteUrl()).toBe('http://localhost:3000');
  });
});
