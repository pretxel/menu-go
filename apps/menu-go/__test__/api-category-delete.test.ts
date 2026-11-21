/**
 * @jest-environment node
 */
import { getServerSession } from 'next-auth';

import { DELETE } from '../src/app/api/category/[categoryId]/route';
import { db, resetDb } from './helpers/supabase-fake';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('../src/lib/auth', () => ({ authOptions: {} }));
jest.mock('../src/lib/supabase', () => require('./helpers/supabase-fake').moduleMock());

const mockSession = getServerSession as jest.Mock;

function del(categoryId: string) {
  return DELETE(new Request(`http://x/api/category/${categoryId}`, { method: 'DELETE' }), {
    params: Promise.resolve({ categoryId }),
  });
}

const categoryIds = () => db.tables.mg_category.map((c) => c.id);

beforeEach(() => {
  resetDb({
    mg_user: [{ id: 'u1' }, { id: 'u2' }],
    mg_config_restaurant: [
      { id: 'r1', userId: 'u1' },
      { id: 'r2', userId: 'u2' },
    ],
    mg_category: [
      { id: 'global', name: 'Drinks', description: '', configRestaurantId: null },
      { id: 'empty', name: 'Empty', description: '', configRestaurantId: 'r1' },
      { id: 'used', name: 'Mains', description: '', configRestaurantId: 'r1' },
      { id: 'theirs', name: 'Theirs', description: '', configRestaurantId: 'r2' },
    ],
    mg_dishes: [{ id: 'd1', name: 'Steak', price: 1, configRestaurantId: 'r1', categoryId: 'used' }],
  });
  mockSession.mockReset();
  mockSession.mockResolvedValue({ user: { id: 'u1' } });
});

const ALL = ['global', 'empty', 'used', 'theirs'];

describe('DELETE /api/category/[categoryId]', () => {
  test('401 without a session, nothing deleted', async () => {
    mockSession.mockResolvedValue(null);
    expect((await del('empty')).status).toBe(401);
    expect(categoryIds()).toEqual(ALL);
  });

  test('owner deletes an empty category', async () => {
    const res = await del('empty');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 'empty' });
    expect(categoryIds()).toEqual(['global', 'used', 'theirs']);
  });

  test('404 for a global category, which is kept', async () => {
    const res = await del('global');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Category not found.' });
    expect(categoryIds()).toEqual(ALL);
  });

  test("404 for another restaurant's category, which is kept", async () => {
    expect((await del('theirs')).status).toBe(404);
    expect(categoryIds()).toEqual(ALL);
  });

  test('409 for a category that still has dishes; category and dishes kept', async () => {
    const res = await del('used');
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: 'Category still has dishes. Move or delete them first.',
    });
    expect(categoryIds()).toEqual(ALL);
    expect(db.tables.mg_dishes.map((d) => d.id)).toEqual(['d1']);
  });
});
