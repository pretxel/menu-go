/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';
import Anthropic from '@anthropic-ai/sdk';
import { put } from '@vercel/blob';
import type { ConfigRestaurant, TablesUpdate } from 'db';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';
import QRCode from 'qrcode';
import { z } from 'zod';

import { authOptions } from '../lib/auth';
import { type ActionState,authedAction, requireSession, UnauthorizedError } from '../lib/server-action';
import { resolveSiteUrl } from '../lib/site';
import { getSupabase, unwrap } from '../lib/supabase';
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

const parsedCategorySchema = z.object({
  name: z.string().min(1).max(80),
  dishes: z.array(
    z.object({
      name: z.string().min(1).max(120),
      description: z.string().max(500).optional().default(''),
      price: z.number().min(0).optional().default(0),
      tags: z.array(z.string()).optional().default([]),
    }),
  ),
});

const publishCatalogSchema = z.object({
  restaurant: z.object({
    name: z.string().min(1, 'Name is required').max(120),
    address: z.string().max(200).optional().default(''),
    phone: z.string().max(40).optional().default(''),
  }),
  categories: z.array(parsedCategorySchema),
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

async function findRestaurantByUser(userId: string): Promise<ConfigRestaurant | null> {
  return unwrap(
    await getSupabase()
      .from('mg_config_restaurant')
      .select('*')
      .eq('userId', userId)
      .limit(1)
      .maybeSingle(),
  );
}

async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  let query = getSupabase().from('mg_config_restaurant').select('id').eq('slug', slug);
  if (exceptId) query = query.neq('id', exceptId);
  const rows = unwrap(await query.limit(1));
  return rows.length > 0;
}

// Owner check for a dish: the dish must belong to a restaurant of this user.
async function findOwnedDish(dishId: string, userId: string) {
  return unwrap(
    await getSupabase()
      .from('mg_dishes')
      .select('*, category:mg_category(*), mg_config_restaurant!inner(userId)')
      .eq('id', dishId)
      .eq('mg_config_restaurant.userId', userId)
      .limit(1)
      .maybeSingle(),
  );
}

type ImportCategories = Array<{
  name: string;
  dishes: Array<{ name: string; description?: string; price?: number; tags?: string[] }>;
}>;

export async function updateDish(id: string, image: string): Promise<ActionState> {
  try {
    const session = await requireSession();
    const own = await findOwnedDish(id, session.user.id);
    if (!own) return { message: 'Dish not found.' };
    unwrap(await getSupabase().from('mg_dishes').update({ image }).eq('id', id));
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

  const existConfig = await findRestaurantByUser(userId);
  if (!existConfig) {
    return { message: 'Create your restaurant profile first.' } as ActionState;
  }

  const supabase = getSupabase();
  if (!dishId) {
    unwrap(
      await supabase.from('mg_dishes').insert({
        name,
        categoryId,
        configRestaurantId: existConfig.id,
        description: description || '',
        price: parseFloat(price),
        tags,
        isAvailable,
      }),
    );
  } else {
    const existing = unwrap(
      await supabase
        .from('mg_dishes')
        .select('id')
        .eq('id', dishId)
        .eq('configRestaurantId', existConfig.id)
        .limit(1)
        .maybeSingle(),
    );
    if (!existing) {
      return { message: 'Dish not found.' } as ActionState;
    }
    unwrap(
      await supabase
        .from('mg_dishes')
        .update({ name, price: parseFloat(price), description, tags, isAvailable })
        .eq('id', dishId),
    );
  }

  revalidatePath('/panel/dishes');
  return { message: dishId ? 'Dish updated successfully!' : 'Dish created successfully!' } as ActionState;
});

export const postRestaurant = authedAction(
  postRestaurantSchema,
  async ({ session, input }) => {
    const userId = session.user.id;
    const { name, address, phone, cuisineType, primaryColor, backgroundColor } = input;

    const supabase = getSupabase();
    const existConfig = await findRestaurantByUser(userId);

    let restaurantResp: Restaurant;
    if (!existConfig) {
      let slug = generateSlug(name);
      if (await slugTaken(slug)) slug = `${slug}-${Date.now()}`;

      const restaurant = unwrap(
        await supabase
          .from('mg_config_restaurant')
          .insert({ name, userId, address, phone, slug, cuisineType, primaryColor, backgroundColor })
          .select()
          .single(),
      );

      const menuUrl = `${resolveSiteUrl()}/r/${slug || restaurant.id}`;
      const qrUrl = await QRCode.toDataURL(menuUrl);

      restaurantResp = unwrap(
        await supabase
          .from('mg_config_restaurant')
          .update({ qrCode: qrUrl })
          .eq('id', restaurant.id)
          .select()
          .single(),
      );
    } else {
      const updateData: TablesUpdate<'mg_config_restaurant'> = { name, address, phone };
      if (cuisineType) updateData.cuisineType = cuisineType;
      if (primaryColor) updateData.primaryColor = primaryColor;
      if (backgroundColor) updateData.backgroundColor = backgroundColor;
      if (name !== existConfig.name && !existConfig.slug) {
        const slug = generateSlug(name);
        if (!(await slugTaken(slug, existConfig.id))) updateData.slug = slug;
      }
      restaurantResp = unwrap(
        await supabase
          .from('mg_config_restaurant')
          .update(updateData)
          .eq('id', existConfig.id)
          .select()
          .single(),
      );
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
  const existConfig = await findRestaurantByUser(session.user.id);
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
  const config = await findRestaurantByUser(session.user.id);
  if (!config) return null;
  return unwrap(
    await getSupabase()
      .from('mg_dishes')
      .select('*, category:mg_category(*)')
      .eq('configRestaurantId', config.id),
  );
}

export async function getDish(id: string): Promise<IDish | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const dish = await findOwnedDish(id, session.user.id);
  if (!dish) return null;
  const { mg_config_restaurant: _owner, ...rest } = dish;
  return rest;
}

// Restaurant with its available dishes (and each dish's category), keeping the
// `Dishes` property name the menu components were written against.
async function findMenu(column: 'id' | 'slug', value: string) {
  const row = unwrap(
    await getSupabase()
      .from('mg_config_restaurant')
      .select('*, Dishes:mg_dishes(*, category:mg_category(*))')
      .eq(column, value)
      .limit(1)
      .maybeSingle(),
  );
  if (!row) return null;
  return { ...row, Dishes: row.Dishes.filter((d) => d.isAvailable) };
}

export async function getMenu(restaurantId: string) {
  const restaurantConf = await findMenu('id', restaurantId);

  if (!restaurantConf) throw new Error('No restaurant found');

  return restaurantConf;
}

export async function getMenuBySlug(slug: string) {
  const restaurantConf = await findMenu('slug', slug);

  if (!restaurantConf) {
    // Fallback: try by ID for backward compatibility
    return getMenu(slug);
  }

  return restaurantConf;
}

export async function trackMenuView(restaurantId: string, source: string = 'direct') {
  try {
    unwrap(
      await getSupabase().from('mg_menu_view').insert({ configRestaurantId: restaurantId, source }),
    );
  } catch {
    // Non-critical, don't fail the page load
  }
}

export async function getMenuStats() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { totalViews: 0, qrScans: 0 };
  const config = await findRestaurantByUser(session.user.id);
  if (!config) return { totalViews: 0, qrScans: 0 };
  const supabase = getSupabase();
  const [total, qr] = await Promise.all([
    supabase
      .from('mg_menu_view')
      .select('id', { count: 'exact', head: true })
      .eq('configRestaurantId', config.id),
    supabase
      .from('mg_menu_view')
      .select('id', { count: 'exact', head: true })
      .eq('configRestaurantId', config.id)
      .eq('source', 'qr'),
  ]);
  unwrap(total);
  unwrap(qr);
  return { totalViews: total.count ?? 0, qrScans: qr.count ?? 0 };
}

export async function getAllCategories() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  const config = await findRestaurantByUser(session.user.id);
  // Own categories plus the global ones (configRestaurantId IS NULL).
  const scope = config
    ? `configRestaurantId.eq.${config.id},configRestaurantId.is.null`
    : 'configRestaurantId.is.null';
  return unwrap(await getSupabase().from('mg_category').select('*').or(scope));
}

export async function getCategory(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const config = await findRestaurantByUser(session.user.id);
  const scope = config
    ? `configRestaurantId.eq.${config.id},configRestaurantId.is.null`
    : 'configRestaurantId.is.null';
  return unwrap(
    await getSupabase()
      .from('mg_category')
      .select('*')
      .eq('id', id)
      .or(scope)
      .limit(1)
      .maybeSingle(),
  );
}

export const addCategory = authedAction(addCategorySchema, async ({ session, input }) => {
  const { name, description, configRestaurantId } = input;

  if (configRestaurantId) {
    const own = unwrap(
      await getSupabase()
        .from('mg_config_restaurant')
        .select('id')
        .eq('id', configRestaurantId)
        .eq('userId', session.user.id)
        .limit(1)
        .maybeSingle(),
    );
    if (!own) return { message: 'Restaurant not found.' };
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const image = await openai.images.generate({ model: 'dall-e-2', prompt: name });
  const imageUrl = image.data?.[0]?.url;
  if (!imageUrl) return { message: 'Image generation failed.' };

  const res = await fetch(imageUrl, { cache: 'no-store' });
  const blobImage = await res.blob();
  const blob = await put(name, blobImage, { access: 'public', addRandomSuffix: true });

  unwrap(
    await getSupabase()
      .from('mg_category')
      .insert({
        name,
        description,
        image: blob.url,
        ...(configRestaurantId ? { configRestaurantId } : {}),
      }),
  );

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
  const restaurant = await findRestaurantByUser(session.user.id);
  if (!restaurant) return { hasCategory: false, hasDish: false };
  const supabase = getSupabase();
  const [cats, dishes] = await Promise.all([
    supabase
      .from('mg_category')
      .select('id', { count: 'exact', head: true })
      .eq('configRestaurantId', restaurant.id),
    supabase
      .from('mg_dishes')
      .select('id', { count: 'exact', head: true })
      .eq('configRestaurantId', restaurant.id),
  ]);
  unwrap(cats);
  unwrap(dishes);
  return { hasCategory: (cats.count ?? 0) > 0, hasDish: (dishes.count ?? 0) > 0 };
}

export async function postBulkDishes(
  categories: Array<{
    name: string;
    dishes: Array<{ name: string; description: string; price: number; tags: string[] }>;
  }>,
): Promise<ActionState> {
  try {
    const session = await requireSession();
    const config = await findRestaurantByUser(session.user.id);
    if (!config) return { message: 'Create your restaurant profile first.' };

    await importCategories(config.id, categories);

    revalidatePath('/panel/dishes');
    return { message: 'Bulk import complete.' };
  } catch (e) {
    if (e instanceof UnauthorizedError) return { message: 'Sign in required.', requiresAuth: true };
    console.error(e);
    return { message: 'Bulk import failed.' };
  }
}

// Atomic: mg_import_catalog runs in a single database transaction, reusing
// same-name categories of the restaurant and inserting every dish.
async function importCategories(
  configRestaurantId: string,
  categories: ImportCategories,
): Promise<void> {
  unwrap(
    await getSupabase().rpc('mg_import_catalog', {
      p_config_restaurant_id: configRestaurantId,
      p_categories: categories,
    }),
  );
}

export type PublishCatalogInput = z.infer<typeof publishCatalogSchema>;

export type PublishCatalogResult = {
  slug: string;
  qrCode: string;
  menuUrl: string;
};

export async function publishCatalog(
  input: PublishCatalogInput,
): Promise<ActionState<PublishCatalogResult>> {
  try {
    const session = await requireSession();
    const parsed = publishCatalogSchema.safeParse(input);
    if (!parsed.success) {
      return { message: null, fieldErrors: parsed.error.flatten().fieldErrors };
    }
    const { restaurant: details, categories } = parsed.data;

    const supabase = getSupabase();
    let config = await findRestaurantByUser(session.user.id);

    if (!config) {
      let slug = generateSlug(details.name);
      if (await slugTaken(slug)) slug = `${slug}-${Date.now()}`;

      const menuUrl = `${resolveSiteUrl()}/r/${slug}`;
      const qrCode = await QRCode.toDataURL(menuUrl);

      // Restaurant + catalog in one database transaction.
      config = unwrap(
        await supabase
          .rpc('mg_publish_new_catalog', {
            p_user_id: session.user.id,
            p_name: details.name,
            p_address: details.address ?? '',
            p_phone: details.phone ?? '',
            p_slug: slug,
            p_qr_code: qrCode,
            p_categories: categories,
          })
          .single(),
      );
    } else {
      // Existing restaurant: reuse slug + QR, just import. Backfill QR if missing.
      if (!config.qrCode) {
        const menuUrl = `${resolveSiteUrl()}/r/${config.slug ?? config.id}`;
        const qrCode = await QRCode.toDataURL(menuUrl);
        config = unwrap(
          await supabase
            .from('mg_config_restaurant')
            .update({ qrCode })
            .eq('id', config.id)
            .select()
            .single(),
        );
      }
      await importCategories(config.id, categories);
    }

    revalidatePath('/panel');
    revalidatePath('/panel/dishes');

    const slugOrId = config.slug ?? config.id;
    return {
      message: 'Catalog published!',
      data: {
        slug: slugOrId,
        qrCode: config.qrCode ?? '',
        menuUrl: `${resolveSiteUrl()}/r/${slugOrId}`,
      },
    };
  } catch (e) {
    if (e instanceof UnauthorizedError) return { message: 'Sign in required.', requiresAuth: true };
    console.error(e);
    return { message: 'Publish failed. Please try again.' };
  }
}

