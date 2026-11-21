// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      configRestaurantId?: string | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    /** mg_user.id of the signed-in person. */
    uid?: string;
    /** mg_config_restaurant.id owned by the user, or null when none yet. */
    configRestaurantId?: string | null;
  }
}
