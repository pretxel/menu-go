# Local Development Setup

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | JavaScript runtime |
| PNPM | 8.15.4 | Package manager (specified in `packageManager` field) |
| Docker | Latest | Local PostgreSQL database |
| Git | Latest | Version control |

## 1. Clone and Install

```bash
git clone <repository-url>
cd menu-go-frontend
pnpm install
```

PNPM will install dependencies for all workspaces (`apps/menu-go` and all `packages/*`).

## 2. Environment Variables

Copy the example file and fill in the values:

```bash
cp .env.example .env
```

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:secrect@localhost:5432/menu_go` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | From Google Cloud Console |
| `FACEBOOK_CLIENT_ID` | Facebook OAuth app ID | From Meta Developer Portal |
| `FACEBOOK_CLIENT_SECRET` | Facebook OAuth app secret | From Meta Developer Portal |
| `EMAIL_SERVER` | SMTP connection string for email auth | `smtp://user:pass@smtp.example.com:587` |
| `EMAIL_FROM` | Sender email address | `noreply@dineqrs.com` |
| `SECRET` | NextAuth.js secret (random string) | Generate with `openssl rand -base64 32` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SITE_URL` | Public-facing base URL | (none) |
| `NEXT_PUBLIC_SIE` | Legacy typo version of site URL | (none) |
| `OPENAI_API_KEY` | OpenAI API key for AI features (menu parsing, category images) | (none -- AI features disabled without it) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token | (none -- image upload disabled without it) |

**Note:** `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_SIE` are used for QR code URL generation. The code checks `NEXT_PUBLIC_SITE_URL` first, falling back to `NEXT_PUBLIC_SIE`. For local development, set to `http://localhost:3000`.

### Minimum Setup for Development

To get the app running with just the Credentials (demo) login and no OAuth/AI features:

```env
DATABASE_URL=postgresql://postgres:secrect@localhost:5432/menu_go
SECRET=any-random-string-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 3. Database Setup

### Start PostgreSQL with Docker

```bash
docker compose up -d
```

This starts a PostgreSQL 17 container on port 5432 with:
- User: `postgres`
- Password: `secrect` (intentional typo from original config)
- Container name: `qr-db`

### Initialize the Database

```bash
# Generate the Prisma client
pnpm db:generate

# Push the schema to the database (creates tables)
pnpm db:push

# Optionally seed with sample data
pnpm db:seed
```

### Other Database Commands

```bash
# Reset the database (drops all data and recreates tables)
pnpm db:reset

# Run migrations
pnpm db:migrate

# Run migrations in dev mode
pnpm db:migrate:dev
```

## 4. Run the Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Using the Demo Login

1. Navigate to `http://localhost:3000/login`
2. Use the "Credentials" sign-in option
3. Enter any username/password (the demo provider accepts anything and returns a hardcoded user)
4. You'll be redirected to `/panel`

## 5. Available Scripts

All root-level scripts use `dotenv -e .env` to inject environment variables:

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with hot reload |
| `pnpm build` | Production build |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm test` | Run Jest tests across all packages |
| `pnpm format` | Format code with Prettier |
| `pnpm db:generate` | Generate Prisma client from schema |
| `pnpm db:push` | Push schema to DB + regenerate client |
| `pnpm db:seed` | Seed database with sample data |
| `pnpm db:reset` | Reset database (destructive) |

### Running a Single Test File

```bash
cd apps/menu-go && pnpm test -- --testPathPattern=<filename>
```

## Troubleshooting

### `prisma generate` fails

Make sure `DATABASE_URL` is set in `.env` and the PostgreSQL container is running:

```bash
docker compose ps    # Check container status
docker compose logs db   # Check database logs
```

### OAuth login redirects to error page

- Verify `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (or Facebook equivalents) are set correctly
- Ensure OAuth redirect URIs include `http://localhost:3000/api/auth/callback/google` (and `/callback/facebook`)
- Check that `SECRET` is set

### Port 5432 already in use

Another PostgreSQL instance may be running. Either stop it or change the port mapping in `docker-compose.yml`.

### Port 3000 already in use

Kill the existing process or use a different port:

```bash
lsof -i :3000    # Find the process
kill <PID>       # Kill it
```

### Image uploads fail

Image uploads require a `BLOB_READ_WRITE_TOKEN` from Vercel Blob. For local development without Vercel, image upload functionality will not work.

### AI features not working

Category image generation and menu photo parsing require a valid `OPENAI_API_KEY`. These features will error without the key.
