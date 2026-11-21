import { getSupabase, unwrap } from '../../../../lib/supabase';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ dishId: string }> }
) {
  const { dishId } = await params;
  // Throws when no row matches (single() errors on zero rows).
  const dishDelete = unwrap(
    await getSupabase().from('mg_dishes').delete().eq('id', dishId).select('id').single(),
  );

  return Response.json({ id: dishDelete.id });
}
