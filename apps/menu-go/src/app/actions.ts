'use server';
import { revalidatePath } from 'next/cache';

import prisma from '../lib/prisma';

export type Restaurant = {
  name: string | null;
};

export async function postRestaurant(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const userId = formData.get('userId') as string;

  try {
    const existConfig = await prisma.configRestaurant.findFirst({
      where: { userId },
    });

    if (!existConfig) {
      await prisma.configRestaurant.create({
        data: { name, userId },
      });
    } else {
      await prisma.configRestaurant.update({
        where: { id: existConfig.id },
        data: { name },
      });
    }
    revalidatePath('/panel');
    return { message: `Added todo ` };
  } catch (e) {
    return { message: `ERROO todo ` };
  }
}

export async function getRestaurant(userId): Promise<Restaurant | null> {
  const existConfig = await prisma.configRestaurant.findFirst({
    where: { userId },
  });

  if (!existConfig) return null;

  return { name: existConfig.name };
}
