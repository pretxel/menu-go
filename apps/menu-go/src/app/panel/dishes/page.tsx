import type { Metadata } from 'next';

import Dishes from '../../../components/Dishes';
import DishHeader from '../../../components/Dishes/qr-button';
import ListDishes from '../../../components/List/dishes';
import PhotoMenuImporter from '../../../components/PhotoMenuImporter';
import { getAllCategories, getDishes, getRestaurant } from '../../actions';

export const metadata: Metadata = {
  title: 'Categories',
  description: 'categories',
};

export default async function Page() {
  const dishes = await getDishes();
  const restaurant = await getRestaurant();
  const categories = await getAllCategories();
  return (
    <>
      <DishHeader restaurant={restaurant} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4">
        <PhotoMenuImporter />
      </div>
      <ListDishes dishes={dishes} />
      <Dishes categories={categories} />
    </>
  );
}
