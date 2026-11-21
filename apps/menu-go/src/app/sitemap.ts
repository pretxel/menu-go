import type { MetadataRoute } from 'next';

import { SITE_URL } from '../lib/site';
import { getSupabase, unwrap } from '../lib/supabase';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const restaurants = unwrap(
    await getSupabase()
      .from('mg_config_restaurant')
      .select('slug, updatedAt')
      .not('slug', 'is', null),
  );

  const restaurantRoutes: MetadataRoute.Sitemap = restaurants.map((r) => ({
    url: `${SITE_URL}/r/${r.slug}`,
    lastModified: new Date(r.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/learn`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...restaurantRoutes,
  ];
}
