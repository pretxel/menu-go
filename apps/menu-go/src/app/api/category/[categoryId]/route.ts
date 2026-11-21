import { getSupabase, unwrap } from '../../../../lib/supabase';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const { categoryId } = await params;
  // Throws when no row matches (single() errors on zero rows).
  const dishDelete = unwrap(
    await getSupabase().from('mg_category').delete().eq('id', categoryId).select('id').single(),
  );

  return Response.json({ id: dishDelete.id });
}
