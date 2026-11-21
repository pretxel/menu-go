/**
 * @jest-environment node
 */
import { put } from '@vercel/blob';
import { getServerSession } from 'next-auth';

import { POST } from '../src/app/api/upload/route';

jest.mock('@vercel/blob', () => ({ put: jest.fn() }));
jest.mock('nanoid', () => ({ customAlphabet: () => () => 'abc1234' }));
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('../src/lib/auth', () => ({ authOptions: {} }));

const mockPut = put as jest.Mock;
const mockSession = getServerSession as jest.Mock;

function upload(contentType: string) {
  return POST(
    new Request('http://x/api/upload', {
      method: 'POST',
      headers: { 'content-type': contentType },
      body: 'bytes',
    }),
    undefined,
  );
}

describe('POST /api/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession.mockResolvedValue({ user: { id: 'u1' } });
  });

  test('401 without a session, nothing stored', async () => {
    mockSession.mockResolvedValue(null);
    const res = await upload('image/png');
    expect(res.status).toBe(401);
    expect(mockPut).not.toHaveBeenCalled();
  });

  test('415 for a non-image content type, nothing stored', async () => {
    const res = await upload('text/plain');
    expect(res.status).toBe(415);
    expect(await res.json()).toEqual({ error: 'Only image uploads are allowed.' });
    expect(mockPut).not.toHaveBeenCalled();
  });

  test('415 when the content type is missing', async () => {
    const res = await POST(new Request('http://x/api/upload', { method: 'POST' }), undefined);
    expect(res.status).toBe(415);
    expect(mockPut).not.toHaveBeenCalled();
  });

  test('stores an image and returns the blob', async () => {
    const blob = { url: 'https://blob.vercel-storage.com/abc1234.png', pathname: 'abc1234.png' };
    mockPut.mockResolvedValue(blob);
    const res = await upload('image/png');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(blob);
    expect(mockPut).toHaveBeenCalledWith('abc1234.png', expect.anything(), {
      contentType: 'image/png',
      access: 'public',
    });
  });
});
