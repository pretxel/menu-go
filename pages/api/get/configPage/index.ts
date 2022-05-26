import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@lib/prisma'

// eslint-disable-next-line import/no-anonymous-default-export
export default async (req: NextApiRequest, res: NextApiResponse) => {
    // get
    try {
        const data = await prisma.configRestaurant.findMany()
        return res.status(200).send(data)
    } catch (error) {
        return res.status(500).send({ error })
    }
}
