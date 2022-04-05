import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@lib/prisma'

// eslint-disable-next-line import/no-anonymous-default-export
export default async (req: NextApiRequest, res: NextApiResponse) => {
  // post
  const { name, address, phone, image } = req.body
  console.log(req.body, 'body')
  try {
    const data = await prisma.configRestaurant.create({
      data: {
        name,
        address,
        phone,
        image,
      },
    })

    return res.status(201).send(data)
  } catch (error) {
    return res.status(500).send({ error })
  }
}
