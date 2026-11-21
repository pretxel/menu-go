-- Email/password sign-in for menu-go (openspec change email-password-login).
-- Touches only mg_user. RLS and the anon/authenticated revokes from
-- 1_mg_supabase_js.sql already cover this table and its new columns.

DO $$
BEGIN
  IF EXISTS (
    SELECT lower(email) FROM "mg_user" WHERE email IS NOT NULL
    GROUP BY lower(email) HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'mg_user has emails that differ only by case; merge them before applying this migration';
  END IF;
END $$;

UPDATE "mg_user" SET email = lower(email) WHERE email <> lower(email);

-- With the existing unique index mg_user_email_key this makes emails unique
-- regardless of case, and keeps a plain-column unique index for upserts.
ALTER TABLE "mg_user"
  ADD CONSTRAINT "mg_user_email_lowercase" CHECK (email = lower(email));

-- Lockout after repeated failed password attempts.
ALTER TABLE "mg_user"
  ADD COLUMN "failedLoginCount" integer NOT NULL DEFAULT 0,
  ADD COLUMN "lockedUntil" timestamp(3);
