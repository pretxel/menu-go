/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  authOptions,
  authorizeCredentials,
  LOCKOUT_MS,
  MAX_FAILED_LOGINS,
  persistSignIn,
} from '../src/lib/auth';
import { hashPassword, verifyPassword } from '../src/lib/password';
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

  it('credentials sign-in does not write to the database', async () => {
    const ok = await callbacks.signIn({
      user: { id: 'u1', email: 'pat@example.com' },
      account: { type: 'credentials', provider: 'credentials', providerAccountId: 'u1' },
    } as any);

    expect(ok).toBe(true);
    expect(db.log).toHaveLength(0);
  });

  it('stores OAuth emails lowercased and marks them verified', async () => {
    await persistSignIn({ ...googleUser, email: 'Ana@Example.com' } as any, googleAccount);
    expect(db.tables.mg_user[0].email).toBe('ana@example.com');
    expect(db.tables.mg_user[0].emailVerified).toEqual(expect.any(String));
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

describe('email and password sign-in', () => {
  let stored: string;
  beforeAll(async () => {
    stored = await hashPassword('correct-horse-1');
  });

  const seedPat = (extra: Record<string, any> = {}) =>
    resetDb({
      mg_user: [
        { id: 'pat', email: 'pat@example.com', name: 'Pat', password: stored, failedLoginCount: 0, lockedUntil: null, ...extra },
        { id: 'oauth-only', email: 'ana@example.com', password: null, failedLoginCount: 0, lockedUntil: null },
      ],
    });
  const pat = () => db.tables.mg_user.find((u) => u.id === 'pat')!;

  beforeEach(() => seedPat());
  afterEach(() => jest.useRealTimers());

  it('signs in with the right password, any email case', async () => {
    const user = await authorizeCredentials({ email: ' Pat@Example.COM ', password: 'correct-horse-1' });
    expect(user).toEqual({ id: 'pat', email: 'pat@example.com', name: 'Pat', image: undefined });
  });

  it.each([
    ['wrong password', { email: 'pat@example.com', password: 'nope-nope-1' }],
    ['unknown email', { email: 'ghost@example.com', password: 'correct-horse-1' }],
    ['OAuth-only account', { email: 'ana@example.com', password: 'correct-horse-1' }],
    ['former dev stub credentials', { username: 'jsmith', password: 'anything' }],
    ['missing fields', undefined],
  ])('refuses %s', async (_label, creds) => {
    await expect(authorizeCredentials(creds as any)).resolves.toBeNull();
  });

  it('locks the account after repeated failures, even for the right password', async () => {
    for (let i = 0; i < MAX_FAILED_LOGINS; i++) {
      await authorizeCredentials({ email: 'pat@example.com', password: 'wrong-wrong-1' });
    }
    expect(pat().lockedUntil).toEqual(expect.any(String));
    await expect(
      authorizeCredentials({ email: 'pat@example.com', password: 'correct-horse-1' }),
    ).resolves.toBeNull();
  });

  it('counts failures and resets them on success', async () => {
    await authorizeCredentials({ email: 'pat@example.com', password: 'wrong-wrong-1' });
    expect(pat().failedLoginCount).toBe(1);
    await authorizeCredentials({ email: 'pat@example.com', password: 'correct-horse-1' });
    expect(pat().failedLoginCount).toBe(0);
  });

  it('lets the user in once the lock has expired', async () => {
    // Stored the way PostgREST returns `timestamp without time zone`: no offset.
    const expired = new Date(Date.now() - 1000).toISOString().replace('Z', '');
    const active = new Date(Date.now() + LOCKOUT_MS).toISOString().replace('Z', '');

    seedPat({ lockedUntil: active });
    await expect(
      authorizeCredentials({ email: 'pat@example.com', password: 'correct-horse-1' }),
    ).resolves.toBeNull();

    seedPat({ lockedUntil: expired, failedLoginCount: 3 });
    await expect(
      authorizeCredentials({ email: 'pat@example.com', password: 'correct-horse-1' }),
    ).resolves.toEqual(expect.objectContaining({ id: 'pat' }));
    expect(pat()).toEqual(expect.objectContaining({ failedLoginCount: 0, lockedUntil: null }));
  });

  it('Google sign-in reclaims an unverified password account', async () => {
    const id = await persistSignIn({ ...googleUser, email: 'pat@example.com' } as any, googleAccount);

    expect(id).toBe('pat');
    expect(db.tables.mg_user.filter((u) => u.email === 'pat@example.com')).toHaveLength(1);
    expect(pat().password).toBeNull();
    expect(pat().emailVerified).toEqual(expect.any(String));
    await expect(
      authorizeCredentials({ email: 'pat@example.com', password: 'correct-horse-1' }),
    ).resolves.toBeNull();
  });

  it('a verified account keeps its password after Google sign-in', async () => {
    seedPat({ emailVerified: '2026-01-01T00:00:00' });
    await persistSignIn({ ...googleUser, email: 'pat@example.com' } as any, googleAccount);

    expect(pat().emailVerified).toBe('2026-01-01T00:00:00');
    await expect(verifyPassword('correct-horse-1', pat().password)).resolves.toBe(true);
  });
});
