import { randomBytes, scrypt as scryptCb, type ScryptOptions, timingSafeEqual } from 'node:crypto';

// Stored format: scrypt$<N>$<r>$<p>$<salt b64>$<hash b64>. The parameters
// travel with the hash, so they can be raised later without breaking old ones.
const N = 2 ** 15;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
// scrypt needs 128 * N * r bytes; Node's default maxmem (32 MiB) is exactly
// that for N=2^15, r=8, so leave headroom.
const MAX_MEM = 64 * 1024 * 1024;

function scrypt(password: string, salt: Buffer, keylen: number, options: ScryptOptions) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCb(password, salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await scrypt(plain, salt, KEY_LENGTH, { N, r: R, p: P, maxmem: MAX_MEM });
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
}

/** True only when `stored` is a well-formed scrypt hash of `plain`. */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [n, r, p] = parts.slice(1, 4).map(Number);
  if (![n, r, p].every((v) => Number.isInteger(v) && v > 0)) return false;
  const salt = Buffer.from(parts[4], 'base64');
  const expected = Buffer.from(parts[5], 'base64');
  if (salt.length === 0 || expected.length === 0) return false;
  try {
    const actual = await scrypt(plain, salt, expected.length, { N: n, r, p, maxmem: MAX_MEM });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// A real hash of a random value. Verifying against it when an email is unknown
// (or has no password) costs the same time as a real check, so response time
// does not reveal which emails have accounts.
let dummyHash: Promise<string> | undefined;
export function verifyAgainstDummy(plain: string): Promise<boolean> {
  dummyHash ??= hashPassword(randomBytes(16).toString('hex'));
  return dummyHash.then((h) => verifyPassword(plain, h)).then(() => false);
}
