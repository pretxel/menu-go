import { PrismaClient } from '@prisma/client';

const DefaultUsers = async (prismaClient: PrismaClient) => {
  await prismaClient.category.createMany({
    data: [
      { id: '1', name: 'Entradas', description: 'Entradas' },
      { id: '2', name: 'Platos', description: 'Platos' },
      { id: '3', name: 'Postres', description: 'Postres' },
      { id: '4', name: 'Bebidas', description: 'Bebidas' },
    ],
  });
};

export default DefaultUsers;
