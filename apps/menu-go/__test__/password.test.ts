/**
 * @jest-environment node
 */
import { hashPassword, verifyAgainstDummy, verifyPassword } from '../src/lib/password';

describe('password hashing', () => {
  test('round trip verifies', async () => {
    const stored = await hashPassword('correct-horse-1');
    expect(stored.startsWith('scrypt$32768$8$1$')).toBe(true);
    expect(stored).not.toContain('correct-horse-1');
    await expect(verifyPassword('correct-horse-1', stored)).resolves.toBe(true);
  });

  test('wrong password fails', async () => {
    const stored = await hashPassword('correct-horse-1');
    await expect(verifyPassword('correct-horse-2', stored)).resolves.toBe(false);
  });

  test('same password hashes differently (unique salt)', async () => {
    const [a, b] = await Promise.all([hashPassword('same'), hashPassword('same')]);
    expect(a).not.toBe(b);
  });

  test.each(['', 'plain-text', 'bcrypt$x$y', 'scrypt$0$8$1$abc$def', 'scrypt$32768$8$1$$'])(
    'malformed stored value %p is rejected',
    async (stored) => {
      await expect(verifyPassword('anything', stored)).resolves.toBe(false);
    },
  );

  test('dummy verification always fails', async () => {
    await expect(verifyAgainstDummy('anything')).resolves.toBe(false);
  });
});
