# Phase 1A foundation

This document records the boundaries established during Phase 1A.

## Runtime architecture

- Next.js App Router and React Server Components are the default.
- `proxy.ts` refreshes Supabase cookie sessions and protects application routes.
- `lib/auth/session.ts` verifies identity server-side with `getClaims()`.
- Browser and server Supabase clients are created per usage context.
- Missing Supabase variables produce a visible login configuration state; protected routes fail closed and populated secrets are never committed.

## Application structure

- `app/(auth)` contains public authentication screens.
- `app/(app)` contains the private application shell and future finance routes.
- `components/layout` owns responsive navigation and shell chrome.
- `lib/env`, `lib/errors`, `lib/formatting`, and `lib/validation` contain cross-cutting foundations.
- `lib/i18n` contains typed English and Arabic message dictionaries.
- `tests/unit` contains fast, database-independent foundation tests.

## Security boundary

Phase 1A establishes session plumbing but does not provision users or financial tables. The username resolver, bootstrap owner, database schema, family membership, roles, RLS, and RLS tests are Phase 1B work. Until then, the sign-in form is intentionally disabled and the dashboard contains no financial data.

## Verification

`npm run check` runs formatting, linting, TypeScript, unit tests, and a production build. GitHub Actions runs the same command for every pull request and push to `main`.
