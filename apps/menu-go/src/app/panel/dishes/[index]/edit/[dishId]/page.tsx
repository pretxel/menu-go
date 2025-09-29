import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import DishesForm from '../../../../../../components/Forms/dishesForm';
import { authOptions } from '../../../../../../lib/auth';
import { getCategory, getDish } from '../../../../../actions';

export const metadata: Metadata = {
  title: 'Edit Dish',
  description: 'edit dish',
};

export default async function Page({
  params,
}: {
  params: Promise<{ dishId: string; index: string }>;
}) {
  const { dishId, index } = await params;
  const session = await getServerSession(authOptions);
  const dish = await getDish(dishId);
  const category = await getCategory(index);
  const user = session?.user;

  return (
    <>
      <DishesForm
        userId={user.id}
        categoryId={index}
        dish={dish}
        category={category}
      />
    </>
  );
}
