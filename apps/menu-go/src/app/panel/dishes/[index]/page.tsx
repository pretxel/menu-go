import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import DishesForm from '../../../../components/Forms/dishesForm';
import { authOptions } from '../../../../lib/auth';
import { getCategory } from '../../../actions';

export const metadata: Metadata = {
  title: 'New Product',
  description: 'new product',
};

export default async function Page({ params }: { params: { index: string } }) {
  const session = await getServerSession(authOptions);
  const category = await getCategory(params.index);

  return (
    <>
      <DishesForm
        user={session?.user}
        categoryId={params.index}
        category={category}
      />
    </>
  );
}
