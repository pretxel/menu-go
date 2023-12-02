/* eslint-disable n/handle-callback-err */
'use server';
import { revalidatePath } from 'next/cache';
import QRCode from 'qrcode';

import prisma from '../lib/prisma';

export type Restaurant = {
  name: string | null;
  address: string | null;
  phone: string | null;
  id: string | null;
  qrCode: string | null;
};

export async function updateDish(id: string, image: string) {
  await prisma.dishes.update({
    where: { id },
    data: { image },
  });
}

export async function postDish(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const price = formData.get('price') as string;
  const categoryId = formData.get('categoryId') as string;
  const userId = formData.get('userId') as string;
  const dishId = formData.get('dishId') as string;
  let message = '';

  try {
    const existConfig = await prisma.configRestaurant.findFirst({
      where: { userId },
    });

    if (existConfig) {
      const existDish = await prisma.dishes.findFirst({
        where: { id: dishId },
      });

      if (!existDish) {
        await prisma.dishes.create({
          data: {
            name,
            categoryId,
            configRestaurantId: existConfig.id,
            price: parseFloat(price),
          },
        });
        message = `Dish created successfully!`;
      } else {
        await prisma.dishes.update({
          where: { id: dishId },
          data: { name, price: parseFloat(price) },
        });
        message = `Dish updated successfully!`;
      }
    }

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
      const restaurant = await prisma.configRestaurant.create({
        data: { name, userId, address, phone },
      });

      QRCode.toDataURL(
        `${process.env.NEXT_PUBLIC_SIE}/menu/${restaurant.id}`,
        async (err, url) => {
          await prisma.configRestaurant.update({
            where: { id: restaurant.id },
            data: { qrCode: url },
          });
        }
      );

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
    qrCode: existConfig.qrCode,
    id: existConfig.id,
  };
}

export async function getDishes(userId: string): Promise<any | null> {
  const configRestaurant = await prisma.configRestaurant.findFirst({
    where: { userId },
  });

  const dishes = await prisma.dishes.findMany({
    where: { configRestaurantId: configRestaurant?.id },
    include: {
      category: true,
    },
  });

  if (!dishes) return null;

  return dishes;
}

export async function getDish(id: string): Promise<any | null> {
  const dish = await prisma.dishes.findFirst({
    where: { id },
    include: {
      category: true,
    },
  });

  return dish;
}

export async function getMenu(restaurantId: string) {
  const restaurantConf = await prisma.configRestaurant.findFirst({
    where: { id: restaurantId },
    include: { Dishes: { include: { category: true } } },
  });

  if (!restaurantConf) throw new Error('No restaurant found');

  return restaurantConf;
}
