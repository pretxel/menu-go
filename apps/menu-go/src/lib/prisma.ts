/* eslint-disable */
import { PrismaClient } from 'db';

declare global {
  var prisma: PrismaClient | undefined;
}

// create only one prisma client instance for development
const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;
