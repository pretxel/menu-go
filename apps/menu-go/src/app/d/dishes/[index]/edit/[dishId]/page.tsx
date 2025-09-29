import type { Metadata } from 'next';

import DishesForm from '../../../../../../components/Forms/dishesForm';
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
  const dish = await getDish(dishId);
  const category = await getCategory(index);

  return (
    <>
      <DishesForm
        userId={undefined}
        categoryId={index}
        dish={dish}
        category={category}
      />
    </>
  );
}
