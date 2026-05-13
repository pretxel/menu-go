import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import ImportHeroPage from '../../../../components/PhotoMenuImporter/import-hero-page';
import { authOptions } from '../../../../lib/auth';
import { getRestaurant } from '../../../actions';

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/panel');

  const restaurant = await getRestaurant();
  if (!restaurant) redirect('/panel');

  return <ImportHeroPage />;
}
