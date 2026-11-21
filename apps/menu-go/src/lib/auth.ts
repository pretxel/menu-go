import type { TablesInsert } from 'db';
import type { Account, NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import FacebookProvider from 'next-auth/providers/facebook';
import GoogleProvider from 'next-auth/providers/google';
import type { Provider } from 'next-auth/providers/index';

import { findOwnedRestaurantId } from './owned-restaurant';
import { verifyAgainstDummy, verifyPassword } from './password';
import { getSupabase, unwrap } from './supabase';

function envPair(idKey: string, secretKey: string): { id: string; secret: string } | null {
  const id = process.env[idKey];
  const secret = process.env[secretKey];
  return id && secret ? { id, secret } : null;
}

const providers: Provider[] = [];

const facebook = envPair('FACEBOOK_CLIENT_ID', 'FACEBOOK_CLIENT_SECRET');
if (facebook) {
  providers.push(FacebookProvider({ clientId: facebook.id, clientSecret: facebook.secret }));
}

const google = envPair('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET');
if (google) {
  providers.push(GoogleProvider({ clientId: google.id, clientSecret: google.secret }));
}

export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;

// mg_user timestamps are `timestamp without time zone` holding UTC. PostgREST
// returns them without an offset, which `new Date()` would read as local time.
function parseUtc(ts: string): number {
  return Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(ts) ? ts : `${ts}Z`);
}

/**
 * Check an email/password pair (design: email-password-login §3). Returns the
 * user for NextAuth, or null for every failure: unknown email, no password,
 * locked account or wrong password all look the same to the caller.
 */
export async function authorizeCredentials(
  credentials: Record<string, string> | undefined,
): Promise<User | null> {
  const email = credentials?.email?.trim().toLowerCase();
  const password = credentials?.password;
  if (!email || !password) return null;

  const supabase = getSupabase();
  const row = unwrap(
    await supabase
      .from('mg_user')
      .select('id, email, name, image, password, failedLoginCount, lockedUntil')
      .eq('email', email)
      .limit(1)
      .maybeSingle(),
  );

  if (!row?.password) {
    await verifyAgainstDummy(password);
    return null;
  }
  if (row.lockedUntil && parseUtc(row.lockedUntil) > Date.now()) {
    await verifyAgainstDummy(password);
    return null;
  }

  if (!(await verifyPassword(password, row.password))) {
    const failures = row.failedLoginCount + 1;
    const locked = failures >= MAX_FAILED_LOGINS;
    unwrap(
      await supabase
        .from('mg_user')
        .update(
          locked
            ? { failedLoginCount: 0, lockedUntil: new Date(Date.now() + LOCKOUT_MS).toISOString() }
            : { failedLoginCount: failures },
        )
        .eq('id', row.id),
    );
    return null;
  }

  if (row.failedLoginCount !== 0 || row.lockedUntil) {
    unwrap(
      await supabase
        .from('mg_user')
        .update({ failedLoginCount: 0, lockedUntil: null })
        .eq('id', row.id),
    );
  }
  return { id: row.id, email: row.email, name: row.name, image: row.image };
}

providers.push(
  CredentialsProvider({
    name: 'Email',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    authorize: (credentials) => authorizeCredentials(credentials),
  }),
);

/**
 * Record the signed-in person in mg_user (keyed by email) and, for OAuth
 * sign-ins, the linked provider account in mg_account. Both are upserts, so
 * repeat sign-ins never create duplicates. Returns the mg_user id.
 */
export async function persistSignIn(user: User, account: Account | null): Promise<string> {
  if (!user.email) throw new Error('Sign-in without an email address');
  const email = user.email.trim().toLowerCase();
  const supabase = getSupabase();
  const isOAuth = account?.type === 'oauth';

  const row: TablesInsert<'mg_user'> = { email, name: user.name ?? null, image: user.image ?? null };
  if (isOAuth) {
    // Google/Facebook only return confirmed emails: the first proof that this
    // person owns the address. A password set by whoever signed up first
    // without verification stops working (design §4).
    const existing = unwrap(
      await supabase
        .from('mg_user')
        .select('emailVerified, password')
        .eq('email', email)
        .limit(1)
        .maybeSingle(),
    );
    row.emailVerified = existing?.emailVerified ?? new Date().toISOString();
    if (existing && !existing.emailVerified && existing.password) row.password = null;
  }

  const dbUser = unwrap(
    await supabase.from('mg_user').upsert(row, { onConflict: 'email' }).select('id').single(),
  );

  if (account && isOAuth) {
    unwrap(
      await supabase.from('mg_account').upsert(
        {
          userId: dbUser.id,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          access_token: account.access_token ?? null,
          refresh_token: account.refresh_token ?? null,
          expires_at: account.expires_at ?? null,
          token_type: account.token_type ?? null,
          scope: account.scope ?? null,
          id_token: account.id_token ?? null,
          session_state: typeof account.session_state === 'string' ? account.session_state : null,
        },
        { onConflict: 'provider,providerAccountId' },
      ),
    );
  }

  return dbUser.id;
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const row = unwrap(
    await getSupabase().from('mg_user').select('id').eq('email', email).limit(1).maybeSingle(),
  );
  return row?.id ?? null;
}

export const authOptions: NextAuthOptions = {
  // JWT sessions: no session table. Users and accounts are persisted in signIn.
  session: { strategy: 'jwt' },
  providers,
  secret: process.env.SECRET,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      // Password users already exist in mg_user; authorize() checked them.
      if (account?.type === 'credentials') return true;
      try {
        await persistSignIn(user, account);
        return true;
      } catch (e) {
        // NextAuth shows its error page and issues no session.
        console.error('[auth] could not persist sign-in', e);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      // Honor relative and same-origin callback URLs (e.g. the /d funnel);
      // anything else falls back to the panel.
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (url.startsWith(`${baseUrl}/`) || url === baseUrl) return url;
      return `${baseUrl}/panel`;
    },
    async jwt({ token, user }) {
      // On sign-in, swap the provider's user id for the mg_user id.
      if (user?.email) {
        token.uid = (await findUserIdByEmail(user.email.toLowerCase())) ?? undefined;
        token.configRestaurantId = null;
      }
      // Until the user owns a restaurant, look it up on every read so one
      // created mid-session (e.g. the /d funnel publish) shows up right away.
      if (token.uid && !token.configRestaurantId) {
        token.configRestaurantId = await findOwnedRestaurantId(token.uid);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        session.user.id = token.uid;
        session.user.configRestaurantId = token.configRestaurantId ?? null;
      }
      return session;
    },
  },
};
