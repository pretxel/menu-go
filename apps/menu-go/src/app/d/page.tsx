import type { Metadata } from 'next';

import Form from '../../components/Forms';

export const metadata: Metadata = {
  title: 'Panel',
  description: 'main panel',
};

export default async function Page() {
  return <Form userId={undefined} />;
}
