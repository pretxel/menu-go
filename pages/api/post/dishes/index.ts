import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@lib/prisma'

// eslint-disable-next-line import/no-anonymous-default-export
export default async (req: NextApiRequest, res: NextApiResponse) => {
    // post
    const { name, categories } = req.body
    try {
        const data = await prisma.dishes.create({
            data: {
                name,
                categories,
            },
        })

        return res.status(201).send(data)
    } catch (error) {
        return res.status(500).send({ error })
    }
}
