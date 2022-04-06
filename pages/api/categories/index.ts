import { NextApiRequest, NextApiResponse } from 'next'
import { GenerateCategories } from '../../../mocks'
import { Category } from '../../../models'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const categoriesMock: Array<Category> = GenerateCategories(10)
  res.status(200).json(categoriesMock)
}
