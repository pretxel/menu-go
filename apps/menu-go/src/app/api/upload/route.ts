import { put } from '@vercel/blob';
import { customAlphabet } from 'nanoid';

import { jsonError, withSession } from '../../../lib/route-auth';

// Node.js runtime (not Edge) so the NextAuth session can be read.

const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  7
); // 7-character random string

export const POST = withSession(async (_session, req: Request) => {
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) {
    return jsonError(415, 'Only image uploads are allowed.');
  }
  const filename = `${nanoid()}.${contentType.split('/')[1]}`;
  const blob = await put(filename, req.body ?? '', {
    contentType,
    access: 'public',
  });

  return Response.json(blob);
});
