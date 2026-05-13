import { getServerSession } from 'next-auth';
import { z, ZodSchema } from 'zod';

import { authOptions } from './auth';

export type ActionState<T = void> = {
  message: string | null;
  data?: T;
  fieldErrors?: Record<string, string[] | undefined>;
  requiresAuth?: boolean;
};

export class UnauthorizedError extends Error {
  constructor(message = 'Not signed in') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export type AuthedSession = { user: { id: string; email?: string | null } };

export async function requireSession(): Promise<AuthedSession> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new UnauthorizedError();
  return session as AuthedSession;
}

type Handler<S extends ZodSchema, R> = (args: {
  session: AuthedSession;
  input: z.infer<S>;
}) => Promise<ActionState<R>>;

export function authedAction<S extends ZodSchema, R = void>(
  schema: S,
  handler: Handler<S, R>,
) {
  return async (
    _prev: ActionState<R>,
    formData: FormData,
  ): Promise<ActionState<R>> => {
    try {
      const session = await requireSession();
      const raw = Object.fromEntries(formData.entries());
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        return {
          message: null,
          fieldErrors: parsed.error.flatten().fieldErrors,
        };
      }
      // `await` required: lets the try/catch capture handler rejections.
      return await handler({ session, input: parsed.data });
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        return { message: 'Sign in required.', requiresAuth: true };
      }
      console.error(e);
      return { message: 'Something went wrong.' };
    }
  };
}
