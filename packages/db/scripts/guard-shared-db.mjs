// Refuses to run schema-wide Prisma commands (db push, migrate reset) against
// the shared Supabase database. menu-go shares the gridscore project's public
// schema with other apps; those commands would drop every table Prisma does not
// know about. Local Docker databases are allowed.
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '';

if (/supabase\.(co|com)/.test(url)) {
  console.error(
    [
      'Refusing to run: DATABASE_URL/DIRECT_URL points at Supabase.',
      'menu-go shares that database with other apps; `prisma db push` and',
      '`prisma migrate reset` would drop their tables.',
      'Add a migration under prisma/migrations (mg_-prefixed tables only)',
      'and run `pnpm db:migrate` instead.',
    ].join('\n'),
  );
  process.exit(1);
}
