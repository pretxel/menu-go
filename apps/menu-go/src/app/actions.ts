'use server';
import { revalidatePath } from 'next/cache';

import prisma from '../lib/prisma';

export type Restaurant = {
  name: string | null;
  address: string | null;
  phone: string | null;
};

export async function postRestaurant(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const address = formData.get('address') as string;
  const phone = formData.get('phone') as string;
  const userId = formData.get('userId') as string;
  let message = '';

  try {
    const existConfig = await prisma.configRestaurant.findFirst({
      where: { userId },
    });

    if (!existConfig) {
      await prisma.configRestaurant.create({
        data: { name, userId, address, phone },
      });
      message = `Restaurant created successfully!`;
    } else {
      await prisma.configRestaurant.update({
        where: { id: existConfig.id },
        data: { name, address, phone },
      });
      message = `Restaurant updated successfully!`;
    }
    revalidatePath('/panel');
    return { message };
  } catch (e) {
    return { message: `ERROO todo ` };
  }
}

export async function getRestaurant(userId): Promise<Restaurant | null> {
  const existConfig = await prisma.configRestaurant.findFirst({
    where: { userId },
  });

  if (!existConfig) return null;

  return {
    name: existConfig.name,
    address: existConfig.address,
    phone: existConfig.phone,
  };
}
