import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import ImportHeroPage from '../../../../components/PhotoMenuImporter/import-hero-page';
import { authOptions } from '../../../../lib/auth';
import { getRestaurant } from '../../../actions';

export default async function Page() {
  const session = await getServerSession(authOptions);
  const restaurant = await getRestaurant(session?.user.id);

  if (!restaurant) redirect('/panel');

  return <ImportHeroPage userId={session!.user.id} />;
}
