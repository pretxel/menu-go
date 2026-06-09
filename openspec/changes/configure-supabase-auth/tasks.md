# Tasks: Configure Supabase + Validate Authentication

## 1. Provision Supabase Project

- [x] 1.1 Get cost for a new project in org `rfugqrwvpvjceflrjmeg` (`get_cost`) and confirm it (`confirm_cost`)
- [x] 1.2 Create project `menu-go` in region `eu-west-1` (`create_project`); capture the generated database password
- [x] 1.3 Wait for project status `ACTIVE_HEALTHY` (`get_project`)

## 2. Wire Connection Strings

- [x] 2.1 Set `DATABASE_URL` in `.env` to the Supavisor transaction pooler URL (port 6543)
- [x] 2.2 Set `DIRECT_URL` in `.env` to the session pooler URL (port 5432)
- [x] 2.3 Update `packages/db/prisma.config.ts` to use `env('DIRECT_URL')` with fallback to `DATABASE_URL`
- [x] 2.4 Update `.env.example` with placeholder `DATABASE_URL` + `DIRECT_URL` entries and explanatory comments

## 3. Deploy Schema and Seed

- [x] 3.1 Run `pnpm db:push` against Supabase and confirm it completes without errors
- [x] 3.2 Run `pnpm db:seed` to load default categories
- [x] 3.3 Verify tables via MCP `list_tables` (`User`, `Account`, `Session`, `VerificationToken`, `ConfigRestaurant`, `Dishes`, `Category`) and seeded `Category` rows via `execute_sql`

## 4. Validate Authentication

- [x] 4.1 Start dev server (`pnpm dev`) and confirm it boots with the Supabase `DATABASE_URL`
- [x] 4.2 Verify anonymous request to `/panel` redirects to `/login`
- [x] 4.3 Sign in via Credentials provider on `/login`; verify `next-auth.session-token` cookie issued and redirect to `/panel`
- [x] 4.4 Verify `/api/auth/session` returns `user.id` and `configRestaurantId` (value or `null`) — exercises the session callback's Prisma query against Supabase
- [ ] 4.5 If Google/Facebook env keys present: OAuth sign-in, then verify `User`/`Account` rows in Supabase via `execute_sql`

## 5. Health Check and Docs

- [x] 5.1 Run `get_advisors` (security + performance); record findings, fix any introduced by this change
- [x] 5.2 Fetch Postgres logs (`get_logs`) for the validation window; confirm no NextAuth/Prisma query errors
- [x] 5.3 Update `CLAUDE.md`/`README` environment sections: Supabase as primary DB, Docker Compose as local fallback, free-tier pause caveat
- [x] 5.4 Confirm no real credentials in tracked files (`git diff` review)
