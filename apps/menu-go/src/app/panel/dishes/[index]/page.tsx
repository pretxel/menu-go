import { getServerSession } from 'next-auth';

import DishesForm from '../../../../components/Forms/dishesForm';
import { authOptions } from '../../../../lib/auth';

export default async function Page() {
  const session = await getServerSession(authOptions);

  return (
    <>
      <DishesForm user={session?.user} categoryId={1} />
    </>
  );
}
