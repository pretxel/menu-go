/* eslint-disable @typescript-eslint/no-explicit-any */
import { authOptions, persistSignIn } from '../src/lib/auth';
import { db, failNext, resetDb } from './helpers/supabase-fake';

jest.mock('../src/lib/supabase', () => require('./helpers/supabase-fake').moduleMock());
jest.mock('next-auth/providers/credentials', () => ({ __esModule: true, default: jest.fn(() => ({ id: 'credentials' })) }));
jest.mock('next-auth/providers/google', () => ({ __esModule: true, default: jest.fn(() => ({ id: 'google' })) }));
jest.mock('next-auth/providers/facebook', () => ({ __esModule: true, default: jest.fn(() => ({ id: 'facebook' })) }));

const callbacks = authOptions.callbacks as Required<NonNullable<typeof authOptions.callbacks>>;

const googleUser = { id: 'google-sub-1', email: 'ana@example.com', name: 'Ana', image: 'https://img/ana.png' };
const googleAccount = {
  type: 'oauth',
  provider: 'google',
  providerAccountId: 'google-sub-1',
  access_token: 'at',
  token_type: 'Bearer',
  scope: 'openid email',
  expires_at: 123,
} as any;

beforeEach(() => resetDb());

describe('auth configuration', () => {
  it('uses JWT sessions without a database adapter', () => {
    expect(authOptions.session?.strategy).toBe('jwt');
    expect(authOptions.adapter).toBeUndefined();
  });
});

describe('signIn persistence', () => {
  it('first OAuth sign-in creates one user and one linked account', async () => {
    const ok = await callbacks.signIn({ user: googleUser, account: googleAccount } as any);

    expect(ok).toBe(true);
    expect(db.tables.mg_user).toEqual([
      expect.objectContaining({ email: 'ana@example.com', name: 'Ana', image: 'https://img/ana.png' }),
    ]);
    expect(db.tables.mg_account).toEqual([
      expect.objectContaining({
        userId: db.tables.mg_user[0].id,
        provider: 'google',
        providerAccountId: 'google-sub-1',
        type: 'oauth',
      }),
    ]);
  });

  it('repeat sign-in reuses the user and account (no duplicates)', async () => {
    const first = await persistSignIn(googleUser as any, googleAccount);
    const second = await persistSignIn({ ...googleUser, name: 'Ana B.' } as any, googleAccount);

    expect(second).toBe(first);
    expect(db.tables.mg_user).toHaveLength(1);
    expect(db.tables.mg_user[0].name).toBe('Ana B.');
    expect(db.tables.mg_account).toHaveLength(1);
  });

  it('credentials sign-in records the user but no provider account', async () => {
    await callbacks.signIn({
      user: { id: '1', email: 'jsmith@example.com', name: 'J Smith' },
      account: { type: 'credentials', provider: 'credentials', providerAccountId: '1' },
    } as any);

    expect(db.tables.mg_user).toHaveLength(1);
    expect(db.tables.mg_account).toHaveLength(0);
  });

  it('blocks sign-in when the user record cannot be written', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    failNext('mg_user');

    const ok = await callbacks.signIn({ user: googleUser, account: googleAccount } as any);

    expect(ok).toBe(false);
    expect(db.tables.mg_user).toHaveLength(0);
  });

  it('blocks sign-in without an email address', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const ok = await callbacks.signIn({ user: { id: 'x' }, account: googleAccount } as any);
    expect(ok).toBe(false);
  });
});

describe('session contents', () => {
  async function signInAndRead() {
    await persistSignIn(googleUser as any, googleAccount);
    let token = await callbacks.jwt({ token: {}, user: googleUser, account: googleAccount } as any);
    const read = async () => {
      token = await callbacks.jwt({ token } as any);
      return callbacks.session({ session: { user: { email: googleUser.email }, expires: '' }, token } as any);
    };
    return read;
  }

  it('exposes the mg_user id and configRestaurantId null for a user without restaurant', async () => {
    const read = await signInAndRead();
    const session: any = await read();

    expect(session.user.id).toBe(db.tables.mg_user[0].id);
    expect(session.user.configRestaurantId).toBeNull();
  });

  it('picks up a restaurant created after sign-in without signing in again', async () => {
    const read = await signInAndRead();
    await read();

    db.tables.mg_config_restaurant.push({ id: 'rest-new', userId: db.tables.mg_user[0].id });
    const session: any = await read();

    expect(session.user.configRestaurantId).toBe('rest-new');
  });
});
