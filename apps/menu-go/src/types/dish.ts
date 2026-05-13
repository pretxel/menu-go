export type CategoryLite = {
  id: string;
  name: string;
  description: string;
  image?: string | null;
};

export type IDish = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: CategoryLite | null;
  categoryId: string;
};
