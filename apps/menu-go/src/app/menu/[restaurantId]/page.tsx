import type { Metadata } from 'next';

import Menu from '../../../components/Menu';
import { getMenu } from '../../actions';

export const metadata: Metadata = {
  title: 'Menu',
  description: 'Menu',
};

export default async function Page({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = await params;
  const restaurant = await getMenu(restaurantId);

  return <Menu dishes={restaurant.Dishes} restaurant={restaurant} />;
}
