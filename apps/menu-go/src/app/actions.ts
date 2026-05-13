/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';
import Anthropic from '@anthropic-ai/sdk';
import { put } from '@vercel/blob';
import { Prisma } from 'db';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';
import QRCode from 'qrcode';
import { z } from 'zod';

import { authOptions } from '../lib/auth';
import prisma from '../lib/prisma';
import { authedAction, requireSession, UnauthorizedError, type ActionState } from '../lib/server-action';
import { IDish } from '../types/dish';

const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const postDishSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Price must be a valid non-negative number'),
  categoryId: z.string().min(1, 'Category is required'),
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
  primaryColor: z.string().optional().default('#4F46E5'),
  backgroundColor: z.string().optional().default('#FFFFFF'),
});

const addCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(80),
  description: z.string().max(500).optional().default(''),
  configRestaurantId: z.preprocess(
    (v) => (v === '' || v === null ? undefined : v),
    z.string().uuid().optional(),
  ),
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

export async function updateDish(id: string, image: string): Promise<ActionState> {
  try {
    const session = await requireSession();
    const own = await prisma.dishes.findFirst({
      where: { id, configRestaurant: { userId: session.user.id } },
      select: { id: true },
    });
    if (!own) return { message: 'Dish not found.' };
    await prisma.dishes.update({ where: { id }, data: { image } });
    revalidatePath('/panel/dishes');
    return { message: 'Image updated.' };
  } catch (e) {
    if (e instanceof UnauthorizedError) return { message: 'Sign in required.', requiresAuth: true };
    console.error(e);
    return { message: 'Something went wrong.' };
  }
}

export const postDish = authedAction(postDishSchema, async ({ session, input }) => {
  const userId = session.user.id;
  const { name, price, categoryId, dishId, description } = input;
  const isAvailable = input.isAvailable !== 'false';
  const tags = input.tags ? input.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  const existConfig = await prisma.configRestaurant.findFirst({ where: { userId } });
  if (!existConfig) {
    return { message: 'Create your restaurant profile first.' } as ActionState;
  }

  if (!dishId) {
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
  } else {
    const existing = await prisma.dishes.findFirst({
      where: { id: dishId, configRestaurantId: existConfig.id },
    });
    if (!existing) {
      return { message: 'Dish not found.' } as ActionState;
    }
    await prisma.dishes.update({
      where: { id: dishId },
      data: { name, price: parseFloat(price), description, tags, isAvailable },
    });
  }

  revalidatePath('/panel/dishes');
  return { message: dishId ? 'Dish updated successfully!' : 'Dish created successfully!' } as ActionState;
});

export const postRestaurant = authedAction(
  postRestaurantSchema,
  async ({ session, input }) => {
    const userId = session.user.id;
    const { name, address, phone, cuisineType, primaryColor, backgroundColor } = input;

    const existConfig = await prisma.configRestaurant.findFirst({ where: { userId } });

    let restaurantResp;
    if (!existConfig) {
      let slug = generateSlug(name);
      const existing = await prisma.configRestaurant.findFirst({ where: { slug } });
      if (existing) slug = `${slug}-${Date.now()}`;

      const restaurant = await prisma.configRestaurant.create({
        data: { name, userId, address, phone, slug, cuisineType, primaryColor, backgroundColor },
      });

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
      const menuUrl = `${siteUrl}/r/${slug || restaurant.id}`;
      const qrUrl = await QRCode.toDataURL(menuUrl);

      restaurantResp = await prisma.configRestaurant.update({
        where: { id: restaurant.id },
        data: { qrCode: qrUrl },
      });
    } else {
      const updateData: Prisma.ConfigRestaurantUpdateInput = { name, address, phone };
      if (cuisineType) updateData.cuisineType = cuisineType;
      if (primaryColor) updateData.primaryColor = primaryColor;
      if (backgroundColor) updateData.backgroundColor = backgroundColor;
      if (name !== existConfig.name && !existConfig.slug) {
        const slug = generateSlug(name);
        const dupe = await prisma.configRestaurant.findFirst({ where: { slug, NOT: { id: existConfig.id } } });
        if (!dupe) updateData.slug = slug;
      }
      restaurantResp = await prisma.configRestaurant.update({
        where: { id: existConfig.id },
        data: updateData,
      });
    }

    revalidatePath('/panel');

    return {
      message: existConfig ? 'Business updated successfully!' : 'Business created successfully!',
      data: restaurantResp,
    };
  },
);

export async function getRestaurant(): Promise<Restaurant | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const existConfig = await prisma.configRestaurant.findFirst({ where: { userId: session.user.id } });
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

export async function getDishes(): Promise<IDish[] | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const config = await prisma.configRestaurant.findFirst({ where: { userId: session.user.id } });
  if (!config) return null;
  const dishes = await prisma.dishes.findMany({
    where: { configRestaurantId: config.id },
    include: { category: true },
  });
  return dishes;
}

export async function getDish(id: string): Promise<IDish | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const dish = await prisma.dishes.findFirst({
    where: { id, configRestaurant: { userId: session.user.id } },
    include: { category: true },
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

export async function getMenuStats() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { totalViews: 0, qrScans: 0 };
  const config = await prisma.configRestaurant.findFirst({ where: { userId: session.user.id } });
  if (!config) return { totalViews: 0, qrScans: 0 };
  const [totalViews, qrScans] = await Promise.all([
    prisma.menuView.count({ where: { configRestaurantId: config.id } }),
    prisma.menuView.count({ where: { configRestaurantId: config.id, source: 'qr' } }),
  ]);
  return { totalViews, qrScans };
}

export async function getAllCategories() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  const config = await prisma.configRestaurant.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  return prisma.category.findMany({
    where: {
      OR: [
        ...(config ? [{ configRestaurantId: config.id }] : []),
        { configRestaurantId: null },
      ],
    },
  });
}

export async function getCategory(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const config = await prisma.configRestaurant.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  return prisma.category.findFirst({
    where: {
      id,
      OR: [
        ...(config ? [{ configRestaurantId: config.id }] : []),
        { configRestaurantId: null },
      ],
    },
  });
}

export const addCategory = authedAction(addCategorySchema, async ({ session, input }) => {
  const { name, description, configRestaurantId } = input;

  if (configRestaurantId) {
    const own = await prisma.configRestaurant.findFirst({
      where: { id: configRestaurantId, userId: session.user.id },
      select: { id: true },
    });
    if (!own) return { message: 'Restaurant not found.' };
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const image = await openai.images.generate({ model: 'dall-e-2', prompt: name });
  const imageUrl = image.data?.[0]?.url;
  if (!imageUrl) return { message: 'Image generation failed.' };

  const res = await fetch(imageUrl, { cache: 'no-store' });
  const blobImage = await res.blob();
  const blob = await put(name, blobImage, { access: 'public', addRandomSuffix: true });

  await prisma.category.create({
    data: {
      name,
      description,
      image: blob.url,
      ...(configRestaurantId ? { configRestaurantId } : {}),
    },
  });

  revalidatePath('/panel/categories');
  return { message: 'Category created.' };
});

export async function parseMenuFromPhoto(imageBase64: string): Promise<{
  categories: Array<{
    name: string;
    dishes: Array<{ name: string; description: string; price: number; tags: string[] }>;
  }>;
} | null> {
  await requireSession();
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

export async function getOnboardingStatus(): Promise<{ hasCategory: boolean; hasDish: boolean }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { hasCategory: false, hasDish: false };
  const restaurant = await prisma.configRestaurant.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!restaurant) return { hasCategory: false, hasDish: false };
  const [catCount, dishCount] = await Promise.all([
    prisma.category.count({ where: { configRestaurantId: restaurant.id } }),
    prisma.dishes.count({ where: { configRestaurantId: restaurant.id } }),
  ]);
  return { hasCategory: catCount > 0, hasDish: dishCount > 0 };
}

export async function postBulkDishes(
  categories: Array<{
    name: string;
    dishes: Array<{ name: string; description: string; price: number; tags: string[] }>;
  }>,
): Promise<ActionState> {
  try {
    const session = await requireSession();
    const config = await prisma.configRestaurant.findFirst({ where: { userId: session.user.id } });
    if (!config) return { message: 'Create your restaurant profile first.' };

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
    return { message: 'Bulk import complete.' };
  } catch (e) {
    if (e instanceof UnauthorizedError) return { message: 'Sign in required.', requiresAuth: true };
    console.error(e);
    return { message: 'Bulk import failed.' };
  }
}

