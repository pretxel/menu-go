import { PrismaClient } from '@prisma/client';

import DefaultUsers from './seeders/defaut';
const prisma = new PrismaClient();

async function main() {
  const prisma = new PrismaClient();
  await DefaultUsers(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
