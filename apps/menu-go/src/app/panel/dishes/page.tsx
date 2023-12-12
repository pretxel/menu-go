import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import Dishes from '../../../components/Dishes';
import DishHeader from '../../../components/Dishes/qr-button';
import ListDishes from '../../../components/List/dishes';
import { authOptions } from '../../../lib/auth';
import { getAllCategories, getDishes, getRestaurant } from '../../actions';

export const metadata: Metadata = {
  title: 'Categories',
  description: 'categories',
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  const dishes = await getDishes(session?.user.id);
  const categories = await getAllCategories();
  const restaurant = await getRestaurant(session?.user.id);
  return (
    <>
      <DishHeader restaurant={restaurant} />
      <ListDishes dishes={dishes} />
      <Dishes categories={categories} />
    </>
  );
}
