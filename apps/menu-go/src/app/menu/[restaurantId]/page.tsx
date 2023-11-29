// import { getServerSession } from 'next-auth';

// import Form from '../../components/Forms';
import Menu from '../../../components/Menu';
import { getMenu } from '../../actions';

export default async function Page({
  params,
}: {
  params: { restaurantId: string };
}) {
  const dishes = await getMenu(params.restaurantId);

  return <Menu dishes={dishes} />;
}
