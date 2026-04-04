/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';
import Anthropic from '@anthropic-ai/sdk';
import { put } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import QRCode from 'qrcode';
import { z } from 'zod';

import prisma from '../lib/prisma';
import { IDish } from '../types/dish';

const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const postDishSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Price must be a valid non-negative number'),
  categoryId: z.string().min(1, 'Category is required'),
  userId: z.string().min(1, 'User ID is required'),
  dishId: z.string().optional().default(''),
  description: z.string().optional().default(''),
  tags: z.string().optional().default(''),
  isAvailable: z.string().optional().default('true'),
});

const postRestaurantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required'),
  cuisineType: z.string().optional().default(''),
  userId: z.string().min(1, 'User ID is required'),
  primaryColor: z.string().optional().default('#4F46E5'),
  backgroundColor: z.string().optional().default('#FFFFFF'),
});

export type Restaurant = {
  name: string | null;
  address: string | null;
  phone: string | null;
  id: string | null;
  slug: string | null;
  qrCode: string | null;
  cuisineType: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  backgroundColor: string | null;
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

export async function updateDish(id: string, image: string) {
  await prisma.dishes.update({
    where: { id },
    data: { image },
  });
}

export async function postDish(prevState: any, formData: FormData) {
  const parsed = postDishSchema.safeParse({
    name: formData.get('name'),
    price: formData.get('price'),
    categoryId: formData.get('categoryId'),
    userId: formData.get('userId'),
    dishId: formData.get('dishId') || '',
    description: formData.get('description') || '',
    tags: formData.get('tags') || '',
    isAvailable: formData.get('isAvailable') || 'true',
  });

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const firstError = Object.values(errors).flat()[0] || 'Invalid input';
    return { message: firstError };
  }

  const { name, price, categoryId, userId, dishId, description } = parsed.data;
  const isAvailable = parsed.data.isAvailable !== 'false';
  const tags = parsed.data.tags ? parsed.data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
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
            description: description || '',
            price: parseFloat(price),
            tags,
            isAvailable,
          },
        });
        message = 'Dish created successfully!';
      } else {
        await prisma.dishes.update({
          where: { id: dishId },
          data: { name, price: parseFloat(price), description, tags, isAvailable },
        });
        message = 'Dish updated successfully!';
      }
    }

    revalidatePath('/panel/dishes');
    return { message };
  } catch (e) {
    console.error(e);
    return { message: 'Failed to save dish. Please try again.' };
  }
}

export async function postRestaurant(prevState: any, formData: FormData) {
  const parsed = postRestaurantSchema.safeParse({
    name: formData.get('name'),
    address: formData.get('address'),
    phone: formData.get('phone'),
    cuisineType: formData.get('cuisineType') || '',
    userId: formData.get('userId'),
    primaryColor: formData.get('primaryColor') || undefined,
    backgroundColor: formData.get('backgroundColor') || undefined,
  });

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const firstError = Object.values(errors).flat()[0] || 'Invalid input';
    return { message: firstError };
  }

  const { name, address, phone, cuisineType, userId, primaryColor, backgroundColor } = parsed.data;
  let message = '';

  try {
    const existConfig = await prisma.configRestaurant.findFirst({
      where: { userId },
    });

    let restaurantResp;
    if (!existConfig) {
      const existUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!existUser) {
        await prisma.user.create({ data: { id: userId } });
      }

      // Generate unique slug
      let slug = generateSlug(name);
      const existing = await prisma.configRestaurant.findFirst({ where: { slug } });
      if (existing) slug = `${slug}-${Date.now()}`;

      const restaurant = await prisma.configRestaurant.create({
        data: { name, userId, address, phone, slug, cuisineType, primaryColor, backgroundColor },
      });

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
      const menuUrl = `${siteUrl}/menu/${slug || restaurant.id}`;
      const url = await QRCode.toDataURL(menuUrl);

      await prisma.configRestaurant.update({
        where: { id: restaurant.id },
        data: { qrCode: url },
      });

      restaurantResp = await prisma.configRestaurant.findUnique({
        where: { id: restaurant.id },
      });

      message = 'Business created successfully!';
    } else {
      const updateData: any = { name, address, phone };
      if (cuisineType) updateData.cuisineType = cuisineType;
      if (primaryColor) updateData.primaryColor = primaryColor;
      if (backgroundColor) updateData.backgroundColor = backgroundColor;
      // Update slug if name changed significantly
      if (name !== existConfig.name && !existConfig.slug) {
        const slug = generateSlug(name);
        const existing = await prisma.configRestaurant.findFirst({ where: { slug, NOT: { id: existConfig.id } } });
        if (!existing) updateData.slug = slug;
      }
      await prisma.configRestaurant.update({
        where: { id: existConfig.id },
        data: updateData,
      });
      restaurantResp = await prisma.configRestaurant.findUnique({
        where: { id: existConfig.id },
      });
      message = 'Business updated successfully!';
    }
    revalidatePath('/panel');
    revalidatePath('/d');

    return { message, restaurant: restaurantResp };
  } catch (e) {
    console.error(e);
    return { message: 'Failed to save business.' };
  }
}

export async function getRestaurant(userId: string): Promise<Restaurant | null> {
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
    slug: existConfig.slug,
    cuisineType: existConfig.cuisineType,
    logoUrl: existConfig.logoUrl,
    primaryColor: existConfig.primaryColor,
    backgroundColor: existConfig.backgroundColor,
  };
}

export async function getDishes(userId: string): Promise<IDish[] | null> {
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

export async function getDish(id: string): Promise<IDish | undefined | null> {
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
    include: { Dishes: { include: { category: true }, where: { isAvailable: true } } },
  });

  if (!restaurantConf) throw new Error('No restaurant found');

  return restaurantConf;
}

export async function getMenuBySlug(slug: string) {
  const restaurantConf = await prisma.configRestaurant.findFirst({
    where: { slug },
    include: { Dishes: { include: { category: true }, where: { isAvailable: true } } },
  });

  if (!restaurantConf) {
    // Fallback: try by ID for backward compatibility
    return getMenu(slug);
  }

  return restaurantConf;
}

export async function trackMenuView(restaurantId: string, source: string = 'direct') {
  try {
    await prisma.menuView.create({
      data: { configRestaurantId: restaurantId, source },
    });
  } catch {
    // Non-critical, don't fail the page load
  }
}

export async function getMenuStats(userId: string) {
  const config = await prisma.configRestaurant.findFirst({ where: { userId } });
  if (!config) return { totalViews: 0, qrScans: 0 };

  const [totalViews, qrScans] = await Promise.all([
    prisma.menuView.count({ where: { configRestaurantId: config.id } }),
    prisma.menuView.count({ where: { configRestaurantId: config.id, source: 'qr' } }),
  ]);

  return { totalViews, qrScans };
}

export async function getAllCategories(configRestaurantId?: string) {
  if (configRestaurantId) {
    return prisma.category.findMany({
      where: {
        OR: [
          { configRestaurantId },
          { configRestaurantId: null },
        ],
      },
    });
  }
  return prisma.category.findMany();
}

export async function getCategory(id: string) {
  return prisma.category.findFirst({ where: { id } });
}

export async function addCategory(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const configRestaurantId = formData.get('configRestaurantId') as string | null;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const OpenAI = require('openai').default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const image = await openai.images.generate({
    model: 'dall-e-2',
    prompt: name,
  });

  const res = await fetch(image.data[0].url as string, {
    cache: 'no-store',
  });
  const blobImage = await res.blob();

  const blob = await put(name, blobImage, {
    access: 'public',
  });

  await prisma.category.create({
    data: {
      name,
      description,
      image: blob.url,
      ...(configRestaurantId ? { configRestaurantId } : {}),
    },
  });
  const message = '';
  revalidatePath('/panel/categories');
  return { message };
}

export async function parseMenuFromPhoto(imageBase64: string): Promise<{
  categories: Array<{
    name: string;
    dishes: Array<{ name: string; description: string; price: number; tags: string[] }>;
  }>;
} | null> {
  const [header, base64Data] = imageBase64.split(',');
  const mediaType = (header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg') as
    | 'image/jpeg'
    | 'image/png'
    | 'image/gif'
    | 'image/webp';

  const response = await anthropicClient.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    tools: [
      {
        name: 'extract_menu',
        description: 'Extract all menu items from the image into structured data.',
        input_schema: {
          type: 'object' as const,
          properties: {
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  dishes: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        price: { type: 'number' },
                        tags: {
                          type: 'array',
                          items: {
                            type: 'string',
                            enum: ['vegan', 'vegetarian', 'spicy', 'gluten-free', 'dairy-free'],
                          },
                        },
                      },
                      required: ['name', 'description', 'price', 'tags'],
                    },
                  },
                },
                required: ['name', 'dishes'],
              },
            },
          },
          required: ['categories'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'extract_menu' },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Data },
          },
          {
            type: 'text',
            text: 'Extract all menu items from this image. Use price 0 if not visible.',
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') return null;

  return toolUse.input as {
    categories: Array<{
      name: string;
      dishes: Array<{ name: string; description: string; price: number; tags: string[] }>;
    }>;
  };
}

export async function postBulkDishes(
  userId: string,
  categories: Array<{
    name: string;
    dishes: Array<{ name: string; description: string; price: number; tags: string[] }>;
  }>
) {
  const config = await prisma.configRestaurant.findFirst({ where: { userId } });
  if (!config) throw new Error('Restaurant not found');

  await prisma.$transaction(async (tx) => {
    for (const cat of categories) {
      let category = await tx.category.findFirst({
        where: { name: cat.name, configRestaurantId: config.id },
      });

      if (!category) {
        category = await tx.category.create({
          data: { name: cat.name, description: cat.name, configRestaurantId: config.id },
        });
      }

      for (const dish of cat.dishes) {
        await tx.dishes.create({
          data: {
            name: dish.name,
            description: dish.description || '',
            price: dish.price || 0,
            tags: dish.tags || [],
            configRestaurantId: config.id,
            categoryId: category.id,
          },
        });
      }
    }
  });

  revalidatePath('/panel/dishes');
}

