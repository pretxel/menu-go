/**
 * @jest-environment node
 */
import { POST } from '../src/app/api/sign-up/route';
import { verifyPassword } from '../src/lib/password';
import { db, resetDb } from './helpers/supabase-fake';

jest.mock('../src/lib/supabase', () => require('./helpers/supabase-fake').moduleMock());

async function signUp(fields: Record<string, string>) {
  const res = await POST(
    new Request('http://x/api/sign-up', { method: 'POST', body: JSON.stringify(fields) }),
  );
  return { status: res.status, body: await res.json() };
}

beforeEach(() => resetDb());

describe('POST /api/sign-up', () => {
  test('creates an account with a lowercased email and a hashed password', async () => {
    const res = await signUp({ email: ' Owner@Example.com ', password: 'correct-horse-1', name: 'Owner' });

    expect(res).toEqual({ status: 201, body: {} });
    expect(db.tables.mg_user).toHaveLength(1);
    const user = db.tables.mg_user[0];
    expect(user).toEqual(expect.objectContaining({ email: 'owner@example.com', name: 'Owner' }));
    expect(user.password).not.toBe('correct-horse-1');
    await expect(verifyPassword('correct-horse-1', user.password)).resolves.toBe(true);
  });

  test('400 for a body that is not JSON', async () => {
    const res = await POST(new Request('http://x/api/sign-up', { method: 'POST', body: 'nope' }));
    expect(res.status).toBe(400);
  });

  test('name is optional', async () => {
    await signUp({ email: 'a@example.com', password: 'correct-horse-1' });
    expect(db.tables.mg_user[0].name).toBeNull();
  });

  test.each([
    ['invalid email', { email: 'not-an-email', password: 'correct-horse-1' }, 'email'],
    ['short password', { email: 'a@example.com', password: 'short' }, 'password'],
    ['long password', { email: 'a@example.com', password: 'x'.repeat(129) }, 'password'],
  ])('refuses %s', async (_label, fields, field) => {
    const res = await signUp(fields);
    expect(res.status).toBe(400);
    expect(res.body.fieldErrors[field].length).toBeGreaterThan(0);
    expect(db.tables.mg_user).toHaveLength(0);
  });

  test('refuses an email that already has an account and leaves it unchanged', async () => {
    resetDb({ mg_user: [{ id: 'g', email: 'owner@example.com', name: 'Google Owner', password: null }] });

    const res = await signUp({ email: 'OWNER@example.com', password: 'correct-horse-1', name: 'Intruder' });

    expect(res).toEqual({
      status: 409,
      body: { error: 'An account with this email already exists. Sign in instead.' },
    });
    expect(db.tables.mg_user).toEqual([
      expect.objectContaining({ id: 'g', name: 'Google Owner', password: null }),
    ]);
  });
});
