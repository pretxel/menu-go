import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import Dishes from '../../../components/Dishes';
import DishHeader from '../../../components/Dishes/qr-button';
import ListDishes from '../../../components/List/dishes';
import PhotoMenuImporter from '../../../components/PhotoMenuImporter';
import { authOptions } from '../../../lib/auth';
import { getAllCategories, getDishes, getRestaurant } from '../../actions';

export const metadata: Metadata = {
  title: 'Categories',
  description: 'categories',
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  const dishes = await getDishes(session?.user.id);
  const restaurant = await getRestaurant(session?.user.id);
  const categories = await getAllCategories(restaurant?.id ?? undefined);
  return (
    <>
      <DishHeader restaurant={restaurant} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4">
        <PhotoMenuImporter userId={session?.user.id} />
      </div>
      <ListDishes dishes={dishes} />
      <Dishes categories={categories} />
    </>
  );
}
