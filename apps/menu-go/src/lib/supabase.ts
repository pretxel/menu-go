import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from 'db';

export type DbClient = SupabaseClient<Database>;

let client: DbClient | undefined;

/**
 * Server-only Supabase client for menu-go's mg_* tables.
 *
 * Uses the service role key, which bypasses RLS: the mg_* tables have RLS on
 * with no policies and no anon/authenticated grants, so this server-side
 * client is the only way in. Never import this from client components;
 * `server-only` makes that a build error.
 */
export function getSupabase(): DbClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  client = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

/**
 * Return `data` from a Supabase response, throwing its error instead.
 * Typed from the success branch, so `.single()` yields the row and
 * `.maybeSingle()` yields `row | null`.
 */
export function unwrap<R extends { data: unknown; error: unknown }>(
  res: R,
): Extract<R, { error: null }>['data'] {
  if (res.error) {
    const message = (res.error as { message?: string }).message ?? 'Supabase request failed';
    throw new Error(message);
  }
  return res.data as Extract<R, { error: null }>['data'];
}
