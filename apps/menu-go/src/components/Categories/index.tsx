import ClientCategory from './client-category';
import ListCategories from './list-categories';

export default async function Categories({ categories, category, categoryId }) {
  return (
    <>
      <ListCategories categories={categories} />
      <ClientCategory categoryId={categoryId} category={category} />
    </>
  );
}
