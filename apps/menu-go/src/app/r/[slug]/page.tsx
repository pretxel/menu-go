import type { Metadata } from 'next';

import Menu from '../../../components/Menu';
import { getMenuBySlug, trackMenuView } from '../../actions';

export const metadata: Metadata = {
  title: 'Menu',
  description: 'Menu',
};

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

  trackMenuView(restaurant.id, src === 'qr' ? 'qr' : 'direct').catch(() => {});

  return <Menu dishes={restaurant.Dishes} restaurant={restaurant} />;
}
