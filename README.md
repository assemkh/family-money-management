# Family Money Management

A private web application for managing our household money together.

The project is currently a deployment-ready foundation built with Next.js, React, TypeScript, Tailwind CSS, Supabase, and Vercel. Supabase browser/server clients, cookie-based authentication, protected routes, and local database tooling are already scaffolded.

## Requirements

- Node.js 22 (Node.js 20.9+ is supported)
- npm 10+
- Docker, only when running Supabase locally
- A Supabase account and project for the hosted database
- A Vercel account connected to GitHub for automatic deployments

## Local setup

```bash
git clone https://github.com/assemkh/family-money-management.git
cd family-money-management
npm install
cp .env.example .env.local
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Set these values in `.env.local` from the Supabase project **Connect** dialog:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Never commit `.env.local`, database passwords, access tokens, or the Supabase service-role key.

## Supabase

The repository includes `supabase/config.toml`, so the schema can be managed through versioned migrations.

```bash
npm run supabase:start
npm run supabase:status
npm run supabase:stop
```

To connect this checkout to a hosted project:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

Before adding financial tables, enable Row Level Security and write policies that restrict every household row to its members. Do not expose a service-role key to browser code.

## Vercel

Push the repository to GitHub, then [import it into Vercel](https://vercel.com/new/import?s=https%3A%2F%2Fgithub.com%2Fassemkh%2Ffamily-money-management). Vercel detects Next.js automatically.

Add the three public environment variables from `.env.example` to the Vercel project for Development, Preview, and Production. Set `NEXT_PUBLIC_SITE_URL` to the production domain, then add the production auth callback URLs in Supabase.

After Git integration is enabled, pushes to non-production branches create preview deployments and pushes to `main` create production deployments.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

Run all three with `npm run check`.

## Current foundation

- Next.js App Router and React Server Components
- Supabase clients for browser and server code
- Cookie refresh proxy for Supabase Auth
- Email/password authentication screens
- Protected example route at `/protected`
- Tailwind CSS and reusable UI components
- Local Supabase CLI configuration

The next product milestone is the household data model: members, accounts, categories, transactions, budgets, recurring items, savings goals, and Row Level Security policies.
