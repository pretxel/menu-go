import { type AuthedSession, requireSession, UnauthorizedError } from './server-action';

/** JSON error body shared by the panel API routes. */
export function jsonError(status: number, error: string): Response {
  return Response.json({ error }, { status });
}

/**
 * Wrap a route handler so it only runs for a signed-in user. Requests without
 * a session get `401 { error }` and the handler is never called.
 */
export function withSession<C>(
  handler: (session: AuthedSession, request: Request, context: C) => Promise<Response>,
) {
  return async (request: Request, context: C): Promise<Response> => {
    let session: AuthedSession;
    try {
      session = await requireSession();
    } catch (e) {
      if (e instanceof UnauthorizedError) return jsonError(401, 'Sign in required.');
      throw e;
    }
    return handler(session, request, context);
  };
}
