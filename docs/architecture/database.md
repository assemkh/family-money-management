# Database Foundation

Phase 1B establishes a strict household identity boundary and the complete core finance schema.

## Public schema

- `families` stores household-level configuration.
- `profiles` maps each Supabase Auth user to one family and an `owner` or `member` role.
- Application clients receive only explicit table and column grants.
- Every exposed application table has Row Level Security enabled.

The core schema includes income sources and entries, expense categories and entries, accounts, assets, investments, savings goals, monthly plans and immutable versions, a normalized financial ledger, transfers, recurring transactions, liabilities, manual exchange rates, family settings, and append-only audit logs.

Authenticated users can read only their family. Owners may update permitted family settings. Members may update permitted profile fields, but client roles cannot change `family_id`, `role`, `username`, or `must_change_password` directly.

## Private schema

RLS helper functions live in the non-exposed `private` schema. They use the verified Supabase Auth user ID to resolve family membership without trusting a client-supplied `family_id` or creating recursive profile policies.

The helpers use `security definer` only for the membership lookup that must bypass profile RLS. Their search path is empty, anonymous execution is revoked, and execution is granted only to authenticated and service roles.

## Owner bootstrap

Run the owner bootstrap only after the migration has been applied and the server-only variables in `.env.local` are populated:

```bash
npm run supabase:bootstrap-owner
```

The command creates the Auth user, family, and owner profile without exposing the internal email or secret key to browser code. It is safe to rerun and never resets an existing owner's password.

The temporary password must be changed on first login. The application layout reads the protected profile flag on every request and does not render the financial workspace until replacement succeeds. Login accepts either the public family username or the associated Auth email. Username resolution, owner provisioning, and profile security mutations use the server-only Supabase client; the secret key is never bundled for the browser.

The bootstrap also copies editable category templates into the family, creates the four planned income sources, creates Cash/CCP/EUR/USD accounts, and installs controlled default settings. Re-running it fills missing seed data without resetting the owner's password.

## Verification

Database policy tests live in `supabase/tests/` and run against the local Supabase stack:

```bash
npm run supabase:test:db
```

The tests cover anonymous denial, same-family visibility, cross-family isolation, owner-only settings, member profile updates, protected role columns, RLS coverage for every table, audit creation, immutable plan history, exact 100% allocations, and category seeds.
