import type { Metadata } from 'next';

import Dishes from '../../../components/Dishes';
import DishHeader from '../../../components/Dishes/qr-button';
import ListDishes from '../../../components/List/dishes';
import UserNoAuth from '../../../components/Menu/user-no-auth';
import { getAllCategories } from '../../actions';

export const metadata: Metadata = {
  title: 'Categories',
  description: 'categories',
};

export default async function Page() {
  const categories = await getAllCategories();

  return (
    <>
      <UserNoAuth />
      <DishHeader restaurant={undefined} />
      <ListDishes dishes={undefined} />
      <Dishes categories={categories} />
    </>
  );
}
