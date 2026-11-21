import { z } from 'zod';

import { hashPassword } from './password';
import { getSupabase } from './supabase';

const UNIQUE_VIOLATION = '23505';

const signUpSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address.')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(128, 'Password must be at most 128 characters.'),
  name: z.string().trim().max(100, 'Name must be at most 100 characters.').optional().default(''),
});

export type SignUpResult =
  | { status: 201 }
  | { status: 400; fieldErrors: Record<string, string[] | undefined> }
  | { status: 409 | 500; error: string };

/**
 * Create an email/password account. Never touches an existing account: a
 * taken email (password or OAuth) is refused. The client signs in afterwards
 * with signIn('credentials'), so session creation has a single path.
 */
export async function signUp(input: Record<string, unknown>): Promise<SignUpResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { status: 400, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { email, password, name } = parsed.data;

  try {
    const { error } = await getSupabase()
      .from('mg_user')
      .insert({ email, name: name || null, password: await hashPassword(password) });
    if (error?.code === UNIQUE_VIOLATION) {
      return { status: 409, error: 'An account with this email already exists. Sign in instead.' };
    }
    if (error) throw new Error(error.message);
    return { status: 201 };
  } catch (e) {
    console.error('[auth] sign-up failed', e);
    return { status: 500, error: 'Something went wrong.' };
  }
}
