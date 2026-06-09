export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dineqrs.com';
export const SITE_NAME = 'Dineqrs';
export const SITE_DESCRIPTION = 'QR menus that actually look like something.';

// Runtime-correct absolute base URL. Unlike SITE_URL (SEO canonical), this
// must resolve to a domain that actually serves the app right now — QR codes
// and share links encode it.
export function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return 'http://localhost:3000';
}
