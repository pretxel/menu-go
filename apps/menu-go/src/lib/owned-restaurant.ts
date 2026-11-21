import { getSupabase, unwrap } from './supabase';

/** Id of the restaurant owned by `userId`, or null when they have none. */
export async function findOwnedRestaurantId(userId: string): Promise<string | null> {
  const row = unwrap(
    await getSupabase()
      .from('mg_config_restaurant')
      .select('id')
      .eq('userId', userId)
      .limit(1)
      .maybeSingle(),
  );
  return row?.id ?? null;
}
