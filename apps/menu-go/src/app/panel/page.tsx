import { getServerSession } from 'next-auth';

import Form from '../../components/Forms';
import { authOptions } from '../../lib/auth';
import { getRestaurant } from '../actions';

export default async function Page() {
  const session = await getServerSession(authOptions);
  const restaurant = await getRestaurant(session?.user.id);

  return <Form user={session?.user} restaurant={restaurant} />;
}
