import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import Form from '../../components/Forms';
import { authOptions } from '../../lib/auth';

export const metadata: Metadata = {
  title: 'Panel',
  description: 'main panel',
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  return <Form userId={user.id} />;
}
