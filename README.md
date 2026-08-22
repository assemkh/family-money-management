# Family Money Management

A private, web-based system for managing household money together.

Phases 1A and 1B establish the production and security foundation: Next.js App Router, Supabase SSR Auth, username-or-email login, forced first-login password replacement, a family-isolated PostgreSQL schema, RLS, audit logging, automated tests, and CI checks.

## Requirements

- Node.js 22
- npm 10+
- A Supabase project
- Docker, only when running Supabase locally

## Local setup

```bash
git clone https://github.com/assemkh/family-money-management.git
cd family-money-management
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without valid Supabase credentials, protected routes fail closed and redirect to the login configuration state.

Add the public values from the Supabase project **Connect** dialog to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Never commit `.env.local`, database passwords, access tokens, bootstrap passwords, or a Supabase secret/service-role key.

## Available routes

- `/dashboard` — authenticated application shell and security readiness
- `/login` — username-or-email and password login
- `/change-password` — authenticated password replacement, mandatory on first login
- `/forgot-password` — username-or-email account recovery
- `/api/health` — safe application and Supabase configuration status

The root route directs visitors to the appropriate dashboard or login experience. Supabase sessions are read server-side, and authenticated routes are rendered dynamically to avoid sharing cached user state.

## Supabase

The repository includes `supabase/config.toml`; future schema changes belong in versioned migrations.

```bash
npm run supabase:start
npm run supabase:status
npm run supabase:stop
```

To link this checkout to a hosted project:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

Phase 1B includes the household schema, every core financial table, Row Level Security policies, immutable monthly plan versions, audit logging, and the one-time owner bootstrap flow.

### Phase 1B database workflow

The Phase 1B migrations establish the family/profile identity boundary, core finance schema, seed category templates, and RLS policies. To reproduce and test them locally:

```bash
npm run supabase:start
npx supabase db reset
npm run supabase:test:db
```

After applying the migration to a controlled environment, populate the server-only bootstrap values in `.env.local` and create the initial owner:

```bash
npm run supabase:bootstrap-owner
```

The bootstrap command must never run with a secret key exposed through a `NEXT_PUBLIC_` variable. See [the database foundation](docs/architecture/database.md) for the security boundaries and current Phase 1B scope.

## Quality checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

Run the complete CI-equivalent suite with:

```bash
npm run check
```

GitHub Actions runs the same suite for pull requests and pushes to `main`.

## Project structure

```text
app/                 Next.js routes, layouts, and global styles
components/          UI, brand, authentication, and shell components
lib/                 Auth, environment, errors, formatting, i18n, validation
supabase/            Supabase CLI configuration and future migrations
tests/unit/          Fast utility and contract tests
docs/                Product plan and architecture notes
```

See [the starting plan](docs/starting_plan.md) for the product roadmap and [the foundation architecture](docs/architecture/foundation.md) for current boundaries and conventions.

## Vercel

Import the GitHub repository into Vercel. Vercel detects Next.js automatically. Add the public environment variables from `.env.example` for Development, Preview, and Production, and set `NEXT_PUBLIC_SITE_URL` to the deployed production domain.

After Git integration is enabled, branch pushes create preview deployments and pushes to `main` create production deployments.
