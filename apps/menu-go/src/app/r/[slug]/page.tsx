import type { Metadata } from 'next';
import { after } from 'next/server';

import Menu from '../../../components/Menu';
import MenuJsonLd from '../../../components/Menu/json-ld';
import prisma from '../../../lib/prisma';
import { SITE_URL } from '../../../lib/site';
import { getMenuBySlug, trackMenuView } from '../../actions';

export const revalidate = 60;

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await prisma.configRestaurant.findFirst({
    where: { slug },
    select: { name: true, address: true, cuisineType: true, logoUrl: true, slug: true, id: true },
  });
  if (!restaurant) return { title: 'Menu not found' };

  const title = restaurant.name ?? 'Menu';
  const description = restaurant.cuisineType
    ? `${title} — ${restaurant.cuisineType} menu`
    : `${title} menu`;
  const canonical = `${SITE_URL}/r/${restaurant.slug ?? restaurant.id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      title,
      description,
      url: canonical,
      images: restaurant.logoUrl ? [{ url: restaurant.logoUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: restaurant.logoUrl ? [restaurant.logoUrl] : undefined,
    },
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ src?: string }>;
}) {
  const { slug } = await params;
  const { src } = await searchParams;
  const restaurant = await getMenuBySlug(slug);

  after(() => {
    trackMenuView(restaurant.id, src === 'qr' ? 'qr' : 'direct').catch(() => {});
  });

  const canonical = `${SITE_URL}/r/${restaurant.slug ?? restaurant.id}`;

  return (
    <>
      <MenuJsonLd restaurant={restaurant} dishes={restaurant.Dishes} url={canonical} />
      <Menu dishes={restaurant.Dishes} restaurant={restaurant} />
    </>
  );
}
