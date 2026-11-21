/**
 * @jest-environment node
 */
import { getServerSession } from 'next-auth';

import { withSession } from '../src/lib/route-auth';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('../src/lib/auth', () => ({ authOptions: {} }));

const mockSession = getServerSession as jest.Mock;

describe('withSession', () => {
  beforeEach(() => mockSession.mockReset());

  test('returns 401 and skips the handler without a session', async () => {
    mockSession.mockResolvedValue(null);
    const handler = jest.fn();
    const res = await withSession(handler)(new Request('http://x/api'), {});
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Sign in required.' });
    expect(handler).not.toHaveBeenCalled();
  });

  test('passes the session, request and context to the handler', async () => {
    mockSession.mockResolvedValue({ user: { id: 'u1' } });
    const handler = jest.fn().mockResolvedValue(Response.json({ ok: true }));
    const req = new Request('http://x/api');
    const ctx = { params: Promise.resolve({ id: '1' }) };
    const res = await withSession(handler)(req, ctx);
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledWith({ user: { id: 'u1' } }, req, ctx);
  });
});
