import type { Metadata } from 'next';

import Categories from '../../../components/Categories';

export const metadata: Metadata = {
  title: 'Categories',
  description: 'categories',
};

export default async function Page() {
  return (
    <>
      <Categories />
    </>
  );
}
