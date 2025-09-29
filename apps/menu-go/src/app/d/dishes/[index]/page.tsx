import type { Metadata } from 'next';

import DishesForm from '../../../../components/Forms/dishesForm';
import { getCategory } from '../../../actions';

export const metadata: Metadata = {
  title: 'New Product',
  description: 'new product',
};

export default async function Page({ params }: { params: Promise<{ index: string }> }) {
  const { index } = await params;
  const category = await getCategory(index);

  return (
    <>
      <DishesForm
        userId={undefined}
        categoryId={index}
        category={category}
      />
    </>
  );
}
