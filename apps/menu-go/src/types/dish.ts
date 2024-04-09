export type IDish = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  category: any;
  categoryId: string;
};
