-- menu-go: drop tables unused after the supabase-js migration.
-- Unused under JWT sessions (no email provider, no database sessions), plus the
-- Prisma bookkeeping table that only menu-go created. All three are empty.
-- Destructive: apply manually (Supabase SQL editor) after confirming row counts are 0.
DROP TABLE "mg_session";
DROP TABLE "mg_verification_token";
DROP TABLE "_prisma_migrations";
