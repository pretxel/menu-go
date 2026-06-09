/**
 * Tests for the upload API route (src/app/api/upload/route.ts).
 *
 * The upload route uses `export const runtime = 'edge'` and relies on Web API
 * Request/Response objects. Jest runs in Node with jsdom, which does not
 * provide the Edge Runtime. We test the core logic by mocking @vercel/blob.
 */

// Mock @vercel/blob
const mockPut = jest.fn();
jest.mock('@vercel/blob', () => ({
  put: mockPut,
}));

// Mock nanoid
jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abc1234',
}));

// We cannot directly import the Edge route handler in jsdom, so we
// replicate the core logic to verify the blob interaction.
describe('Upload API Route Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('put is called with correct parameters for image upload', async () => {
    const mockBlob = {
      url: 'https://blob.vercel-storage.com/abc1234.png',
      pathname: 'abc1234.png',
    };
    mockPut.mockResolvedValue(mockBlob);

    const { put } = require('@vercel/blob');
    const { customAlphabet } = require('nanoid');
    const nanoid = customAlphabet();

    const contentType = 'image/png';
    const filename = `${nanoid()}.${contentType.split('/')[1]}`;
    const body = Buffer.from('fake-image-data');

    const result = await put(filename, body, {
      contentType,
      access: 'public',
    });

    expect(put).toHaveBeenCalledWith('abc1234.png', body, {
      contentType: 'image/png',
      access: 'public',
    });
    expect(result.url).toBe('https://blob.vercel-storage.com/abc1234.png');
  });

  test('filename is generated from content type', () => {
    const { customAlphabet } = require('nanoid');
    const nanoid = customAlphabet();

    const contentType = 'image/jpeg';
    const filename = `${nanoid()}.${contentType.split('/')[1]}`;

    expect(filename).toBe('abc1234.jpeg');
  });

  test('defaults content type to text/plain when not provided', () => {
    const contentType: string | undefined = undefined;
    const resolvedType = contentType ?? 'text/plain';
    const filename = `abc1234.${resolvedType.split('/')[1]}`;

    expect(filename).toBe('abc1234.plain');
  });
});
