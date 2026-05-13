import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import type { Provider } from 'next-auth/providers/index';
import CredentialsProvider from 'next-auth/providers/credentials';
import FacebookProvider from 'next-auth/providers/facebook';
import GoogleProvider from 'next-auth/providers/google';

import prisma from './prisma';

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

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  secret: process.env.SECRET,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async redirect({ baseUrl }) {
      return `${baseUrl}/panel`;
    },
    async session({ session, user }) {
      const dbUser = await prisma.user.findFirst({
        where: { email: user.email },
        include: { ConfigRestaurant: true },
      });
      if (session.user && dbUser) {
        session.user.id = dbUser.id;
        session.user.configRestaurantId = dbUser.ConfigRestaurant.length
          ? dbUser.ConfigRestaurant[0].id
          : null;
      }

      return session;
    },
  },
};
