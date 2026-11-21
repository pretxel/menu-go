import type { Account, NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import FacebookProvider from 'next-auth/providers/facebook';
import GoogleProvider from 'next-auth/providers/google';
import type { Provider } from 'next-auth/providers/index';

import { findOwnedRestaurantId } from './owned-restaurant';
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

providers.push(
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      username: {
        label: 'Username',
        type: 'text',
        placeholder: 'jsmith',
      },
      password: { label: 'Password', type: 'password' },
    },
    async authorize() {
      return { id: '1', name: 'J Smith', email: 'jsmith@example.com' };
    },
  }),
);

/**
 * Record the signed-in person in mg_user (keyed by email) and, for OAuth
 * sign-ins, the linked provider account in mg_account. Both are upserts, so
 * repeat sign-ins never create duplicates. Returns the mg_user id.
 */
export async function persistSignIn(user: User, account: Account | null): Promise<string> {
  if (!user.email) throw new Error('Sign-in without an email address');
  const supabase = getSupabase();

  const dbUser = unwrap(
    await supabase
      .from('mg_user')
      .upsert(
        { email: user.email, name: user.name ?? null, image: user.image ?? null },
        { onConflict: 'email' },
      )
      .select('id')
      .single(),
  );

  if (account && account.type === 'oauth') {
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
        token.uid = (await findUserIdByEmail(user.email)) ?? undefined;
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
