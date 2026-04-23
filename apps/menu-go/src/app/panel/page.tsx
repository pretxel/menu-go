import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import Form from '../../components/Forms';
import OnboardingBanner from '../../components/OnboardingBanner';
import { authOptions } from '../../lib/auth';
import { getOnboardingStatus } from '../actions';

export const metadata: Metadata = {
  title: 'Panel',
  description: 'main panel',
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;

  const { hasCategory, hasDish } = userId
    ? await getOnboardingStatus(userId)
    : { hasCategory: false, hasDish: false };

  return (
    <>
      <OnboardingBanner hasCategory={hasCategory} hasDish={hasDish} />
      <Form userId={userId} />
    </>
  );
}
