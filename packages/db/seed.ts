// Seed the global (restaurant-less) menu categories into the shared gridscore
// project. Idempotent: upserts by id.
// Run: pnpm db:seed (needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
import { createClient } from '@supabase/supabase-js';

import type { Database } from './types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

const supabase = createClient<Database>(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const categories = [
  { id: '1', name: 'Entradas', description: 'Entradas' },
  { id: '2', name: 'Platos', description: 'Platos' },
  { id: '3', name: 'Postres', description: 'Postres' },
  { id: '4', name: 'Bebidas', description: 'Bebidas' },
];

async function main() {
  const { error } = await supabase.from('mg_category').upsert(categories, { onConflict: 'id' });
  if (error) throw new Error(error.message);
  console.log(`Seeded ${categories.length} global categories.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
