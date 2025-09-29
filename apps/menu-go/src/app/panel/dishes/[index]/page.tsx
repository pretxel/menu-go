import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import DishesForm from '../../../../components/Forms/dishesForm';
import { authOptions } from '../../../../lib/auth';
import { getCategory } from '../../../actions';

export const metadata: Metadata = {
  title: 'New Product',
  description: 'new product',
};

export default async function Page({ params }: { params: Promise<{ index: string }> }) {
  const { index } = await params;
  const session = await getServerSession(authOptions);
  const category = await getCategory(index);
  const user = session?.user;
  return (
    <>
      <DishesForm
        userId={user.id}
        categoryId={index}
        category={category}
      />
    </>
  );
}
