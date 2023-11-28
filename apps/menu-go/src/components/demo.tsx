import { getRestaurant } from '../app/actions';
import Form from './Form';
export default async function Demo({ user }) {
  const restaurant = await getRestaurant(user.id);

  return <Form user={user} restaurant={restaurant} />;
}
