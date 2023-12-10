import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import Dishes from '../../../components/Dishes';
import ListDishes from '../../../components/List/dishes';
import { authOptions } from '../../../lib/auth';
import { getAllCategories, getDishes } from '../../actions';

export const metadata: Metadata = {
  title: 'Categories',
  description: 'categories',
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  const dishes = await getDishes(session?.user.id);
  const categories = await getAllCategories();
  return (
    <>
      <ListDishes dishes={dishes} />
      <Dishes categories={categories} />
    </>
  );
}
