import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authedAction } from '../src/lib/server-action';

jest.unmock('zod');

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../src/lib/auth', () => ({ authOptions: {} }));

const schema = z.object({ name: z.string().min(1) });

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

describe('authedAction', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns requiresAuth when no session', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const action = authedAction(schema, async () => ({ message: 'ok' }));
    const res = await action({ message: null }, fd({ name: 'x' }));
    expect(res.requiresAuth).toBe(true);
    expect(res.message).toBe('Sign in required.');
  });

  it('returns fieldErrors on schema failure', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } });
    const action = authedAction(schema, async () => ({ message: 'ok' }));
    const res = await action({ message: null }, fd({ name: '' }));
    expect(res.fieldErrors?.name?.length).toBeGreaterThan(0);
    expect(res.message).toBeNull();
  });

  it('calls handler with parsed input and session on happy path', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } });
    const handler = jest.fn(async () => ({ message: 'created' }));
    const action = authedAction(schema, handler);
    const res = await action({ message: null }, fd({ name: 'dish' }));
    expect(handler).toHaveBeenCalledWith({
      session: { user: { id: 'u1' } },
      input: { name: 'dish' },
    });
    expect(res.message).toBe('created');
  });

  it('returns generic error on unexpected throw', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const action = authedAction(schema, async () => {
        throw new Error('boom');
      });
      const res = await action({ message: null }, fd({ name: 'dish' }));
      expect(res.message).toBe('Something went wrong.');
    } finally {
      spy.mockRestore();
    }
  });

  it('catches async handler rejection', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const action = authedAction(schema, async () => {
        await Promise.resolve();
        throw new Error('async boom');
      });
      const res = await action({ message: null }, fd({ name: 'dish' }));
      expect(res.message).toBe('Something went wrong.');
    } finally {
      spy.mockRestore();
    }
  });
});
