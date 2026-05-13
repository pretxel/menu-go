import type { Metadata } from 'next';

import { getAllCategories, getCategory } from '../../../app/actions';
import Categories from '../../../components/Categories';

export const metadata: Metadata = {
  title: 'Categories',
  description: 'categories',
};

type Props = {
  params: Promise<Record<string, string>>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page(props: Props) {
  const categories = await getAllCategories();
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
