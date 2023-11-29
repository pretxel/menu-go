import { getServerSession } from 'next-auth';

import DishesForm from '../../../../components/Forms/dishesForm';
import { authOptions } from '../../../../lib/auth';

export default async function Page({ params }: { params: { index: string } }) {
  const session = await getServerSession(authOptions);

  return (
    <>
      <DishesForm user={session?.user} categoryId={params.index} />
    </>
  );
}
