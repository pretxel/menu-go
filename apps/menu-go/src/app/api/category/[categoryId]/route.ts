import { findOwnedRestaurantId } from '../../../../lib/owned-restaurant';
import { jsonError, withSession } from '../../../../lib/route-auth';
import { getSupabase, unwrap } from '../../../../lib/supabase';

type Context = { params: Promise<{ categoryId: string }> };

const FOREIGN_KEY_VIOLATION = '23503';

export const DELETE = withSession<Context>(async (session, _request, { params }) => {
  const { categoryId } = await params;
  const restaurantId = await findOwnedRestaurantId(session.user.id);
  if (!restaurantId) return jsonError(404, 'Category not found.');

  // Filtering on configRestaurantId also excludes global categories (NULL).
  const res = await getSupabase()
    .from('mg_category')
    .delete()
    .eq('id', categoryId)
    .eq('configRestaurantId', restaurantId)
    .select('id')
    .maybeSingle();

  if (res.error?.code === FOREIGN_KEY_VIOLATION) {
    return jsonError(409, 'Category still has dishes. Move or delete them first.');
  }
  const deleted = unwrap(res);
  if (!deleted) return jsonError(404, 'Category not found.');

  return Response.json({ id: deleted.id });
});
