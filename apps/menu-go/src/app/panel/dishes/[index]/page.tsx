import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import DishesForm from '../../../../components/Forms/dishesForm';
import { authOptions } from '../../../../lib/auth';

export const metadata: Metadata = {
  title: 'New Dish',
  description: 'new dish',
};

export default async function Page({ params }: { params: { index: string } }) {
  const session = await getServerSession(authOptions);

  return (
    <>
      <DishesForm user={session?.user} categoryId={params.index} />
    </>
  );
}
