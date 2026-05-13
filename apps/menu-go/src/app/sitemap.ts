import type { MetadataRoute } from 'next';

import prisma from '../lib/prisma';
import { SITE_URL } from '../lib/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const restaurants = await prisma.configRestaurant.findMany({
    where: { slug: { not: null } },
    select: { slug: true, updatedAt: true },
  });

  const restaurantRoutes: MetadataRoute.Sitemap = restaurants.map((r) => ({
    url: `${SITE_URL}/r/${r.slug}`,
    lastModified: r.updatedAt,
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
