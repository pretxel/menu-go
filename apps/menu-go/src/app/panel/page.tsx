import type { Metadata } from 'next';

import Form from '../../components/Forms';
import OnboardingBanner from '../../components/OnboardingBanner';
import { getOnboardingStatus, getRestaurant } from '../actions';

export const metadata: Metadata = {
  title: 'Panel',
  description: 'main panel',
};

export default async function Page() {
  const [{ hasCategory, hasDish }, initialRestaurant] = await Promise.all([
    getOnboardingStatus(),
    getRestaurant(),
  ]);

  return (
    <>
      <OnboardingBanner hasCategory={hasCategory} hasDish={hasDish} />
      <Form initialRestaurant={initialRestaurant} />
    </>
  );
}
