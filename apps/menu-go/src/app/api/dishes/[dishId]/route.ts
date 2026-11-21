import { findOwnedRestaurantId } from '../../../../lib/owned-restaurant';
import { jsonError, withSession } from '../../../../lib/route-auth';
import { getSupabase, unwrap } from '../../../../lib/supabase';

type Context = { params: Promise<{ dishId: string }> };

export const DELETE = withSession<Context>(async (session, _request, { params }) => {
  const { dishId } = await params;
  const restaurantId = await findOwnedRestaurantId(session.user.id);
  if (!restaurantId) return jsonError(404, 'Dish not found.');

  // The ownership filter is part of the delete, so a dish from another
  // restaurant is never touched and looks exactly like a missing one.
  const deleted = unwrap(
    await getSupabase()
      .from('mg_dishes')
      .delete()
      .eq('id', dishId)
      .eq('configRestaurantId', restaurantId)
      .select('id')
      .maybeSingle(),
  );
  if (!deleted) return jsonError(404, 'Dish not found.');

  return Response.json({ id: deleted.id });
});
