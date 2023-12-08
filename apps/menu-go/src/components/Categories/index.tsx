import { getAllCategories } from '../../app/actions';
import ClientCategory from './client-category';
import ListCategories from './list-categories';

export default async function Categories() {
  const categories = await getAllCategories();

  return (
    <>
      <ListCategories categories={categories} />
      <ClientCategory />
    </>
  );
}
