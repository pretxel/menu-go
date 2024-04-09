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
  params: { dishId: string; index: string };
}) {
  const dish = await getDish(params.dishId);
  const category = await getCategory(params.index);

  return (
    <>
      <DishesForm
        userId={undefined}
        categoryId={params.index}
        dish={dish}
        category={category}
      />
    </>
  );
}
