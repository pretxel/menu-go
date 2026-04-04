import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import { getAllCategories, getCategory, getRestaurant } from '../../../app/actions';
import Categories from '../../../components/Categories';
import { authOptions } from '../../../lib/auth';

export const metadata: Metadata = {
  title: 'Categories',
  description: 'categories',
};

type Props = {
  params: Promise<Record<string, string>>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page(props: Props) {
  const session = await getServerSession(authOptions);
  const restaurant = await getRestaurant(session?.user.id);
  const categories = await getAllCategories(restaurant?.id ?? undefined);
  const searchParams = await props.searchParams;
  const categoryId = searchParams.category;
  const category = categoryId ? await getCategory(categoryId as string) : null;
  return (
    <>
      <Categories
        categories={categories}
        category={category}
        categoryId={categoryId}
      />
    </>
  );
}
