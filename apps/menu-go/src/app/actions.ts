'use server';
import { revalidatePath } from 'next/cache';

import prisma from '../lib/prisma';

export type Restaurant = {
  name: string | null;
  address: string | null;
  phone: string | null;
};

export async function postDish(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const categoryId = formData.get('categoryId') as string;
  const userId = formData.get('userId') as string;
  let message = '';

  try {
    const existConfig = await prisma.configRestaurant.findFirst({
      where: { userId },
    });

    if (existConfig) {
      await prisma.dishes.create({
        data: { name, categoryId, configRestaurantId: existConfig.id },
      });
    }

    message = `Dish created successfully!`;
    revalidatePath('/panel/dishes');
    return { message };
  } catch (e) {
    console.log(e);
    return { message: `ERROO todo ` };
  }
}

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

export async function getDishes(userId: string): Promise<any | null> {
  const configRestaurant = await prisma.configRestaurant.findFirst({
    where: { userId },
  });

  const dishes = await prisma.dishes.findMany({
    where: { configRestaurantId: configRestaurant?.id },
  });

  if (!dishes) return null;

  return dishes;
}
