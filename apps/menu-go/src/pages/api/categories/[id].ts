import { NextApiRequest, NextApiResponse } from 'next';
import { GenerateCategories } from '../../../mocks';
import { Category } from '../../../models';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const id: string = req.query.id as string;
  // That will fail if id is greater than 10, soon will handle maybe next commit
  const category: Category = GenerateCategories(10)[Number.parseInt(id)];
  res.status(200).json(category);
}
