import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import Dishes from '../../../components/Dishes';
import ListDishes from '../../../components/List/dishes';
import { authOptions } from '../../../lib/auth';
import { getDishes } from '../../actions';

export const metadata: Metadata = {
  title: 'Dishes',
  description: 'main dishes',
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  const dishes = await getDishes(session?.user.id);
  return (
    <>
      <ListDishes dishes={dishes} />
      <Dishes />
    </>
  );
}
