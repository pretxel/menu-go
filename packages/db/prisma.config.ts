import path from 'node:path';

import { config as loadEnv } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

loadEnv({ path: path.resolve(__dirname, '../../.env') });

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    // CLI commands (push/migrate/seed) need a session-mode connection;
    // DIRECT_URL points at it, falling back to DATABASE_URL for local Docker.
    url: process.env.DIRECT_URL ? env('DIRECT_URL') : env('DATABASE_URL'),
  },
});
