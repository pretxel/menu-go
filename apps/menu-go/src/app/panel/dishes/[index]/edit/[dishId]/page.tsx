import { getServerSession } from 'next-auth';

import DishesForm from '../../../../../../components/Forms/dishesForm';
import { authOptions } from '../../../../../../lib/auth';
import { getDish } from '../../../../../actions';

export default async function Page({
  params,
}: {
  params: { dishId: string; index: string };
}) {
  const session = await getServerSession(authOptions);
  const dish = await getDish(params.dishId);

  return (
    <>
      <DishesForm user={session?.user} categoryId={params.index} dish={dish} />
    </>
  );
}
