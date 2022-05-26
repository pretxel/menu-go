import { NextApiRequest, NextApiResponse } from 'next'
import { GenerateDishes } from '../../../mocks'
import { Dish } from '../../../models'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const dishMock: Array<Dish> = GenerateDishes(10)
    res.status(200).json(dishMock)
}
