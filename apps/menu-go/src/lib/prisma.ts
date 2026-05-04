/* eslint-disable */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'db';

declare global {
  var prisma: PrismaClient | undefined;
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prisma: PrismaClient = global.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;
