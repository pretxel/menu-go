import type { Metadata } from 'next';

import DishesForm from '../../../../components/Forms/dishesForm';
import { getCategory } from '../../../actions';

export const metadata: Metadata = {
  title: 'New Product',
  description: 'new product',
};

export default async function Page({ params }: { params: { index: string } }) {
  const category = await getCategory(params.index);

  return (
    <>
      <DishesForm
        userId={undefined}
        categoryId={params.index}
        category={category}
      />
    </>
  );
}
