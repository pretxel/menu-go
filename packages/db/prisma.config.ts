import path from 'node:path';

import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

loadEnv({ path: path.resolve(__dirname, '../../.env') });

// CLI commands (push/migrate/seed) need a session-mode connection;
// DIRECT_URL points at it, falling back to DATABASE_URL for local Docker.
// `prisma generate` (run from postinstall, e.g. during Vercel install)
// needs no connection, so omit the datasource instead of throwing when
// neither variable is set.
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
  ...(url ? { datasource: { url } } : {}),
});
