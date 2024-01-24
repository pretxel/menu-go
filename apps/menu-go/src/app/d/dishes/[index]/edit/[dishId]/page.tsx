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
  params: { dishId: string; index: string };
}) {
  const session = await getServerSession(authOptions);
  const dish = await getDish(params.dishId);
  const category = await getCategory(params.index);
  const user = session?.user;

  return (
    <>
      <DishesForm
        userId={user.id}
        categoryId={params.index}
        dish={dish}
        category={category}
      />
    </>
  );
}
