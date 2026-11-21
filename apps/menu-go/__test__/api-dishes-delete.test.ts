/**
 * @jest-environment node
 */
import { getServerSession } from 'next-auth';

import { DELETE } from '../src/app/api/dishes/[dishId]/route';
import { db, resetDb } from './helpers/supabase-fake';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('../src/lib/auth', () => ({ authOptions: {} }));
jest.mock('../src/lib/supabase', () => require('./helpers/supabase-fake').moduleMock());

const mockSession = getServerSession as jest.Mock;

function del(dishId: string) {
  return DELETE(new Request(`http://x/api/dishes/${dishId}`, { method: 'DELETE' }), {
    params: Promise.resolve({ dishId }),
  });
}

const dishIds = () => db.tables.mg_dishes.map((d) => d.id);

beforeEach(() => {
  resetDb({
    mg_user: [{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }],
    mg_config_restaurant: [
      { id: 'r1', userId: 'u1' },
      { id: 'r2', userId: 'u2' },
    ],
    mg_category: [{ id: 'c1', name: 'Mains', description: '', configRestaurantId: 'r1' }],
    mg_dishes: [
      { id: 'd1', name: 'Mine', price: 1, configRestaurantId: 'r1', categoryId: 'c1' },
      { id: 'd2', name: 'Theirs', price: 1, configRestaurantId: 'r2', categoryId: 'c1' },
    ],
  });
  mockSession.mockReset();
});

describe('DELETE /api/dishes/[dishId]', () => {
  test('401 without a session, nothing deleted', async () => {
    mockSession.mockResolvedValue(null);
    const res = await del('d1');
    expect(res.status).toBe(401);
    expect(dishIds()).toEqual(['d1', 'd2']);
  });

  test('owner deletes their dish', async () => {
    mockSession.mockResolvedValue({ user: { id: 'u1' } });
    const res = await del('d1');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 'd1' });
    expect(dishIds()).toEqual(['d2']);
  });

  test("404 for another restaurant's dish, which is kept", async () => {
    mockSession.mockResolvedValue({ user: { id: 'u1' } });
    const res = await del('d2');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Dish not found.' });
    expect(dishIds()).toEqual(['d1', 'd2']);
  });

  test('404 for an unknown dish', async () => {
    mockSession.mockResolvedValue({ user: { id: 'u1' } });
    expect((await del('nope')).status).toBe(404);
  });

  test('404 for a user without a restaurant', async () => {
    mockSession.mockResolvedValue({ user: { id: 'u3' } });
    expect((await del('d1')).status).toBe(404);
    expect(dishIds()).toEqual(['d1', 'd2']);
  });
});
