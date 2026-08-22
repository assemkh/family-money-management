# Database Foundation

Phase 1B starts with a strict household identity boundary.

## Public schema

- `families` stores household-level configuration.
- `profiles` maps each Supabase Auth user to one family and an `owner` or `member` role.
- Application clients receive only explicit table and column grants.
- Both tables have Row Level Security enabled.

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

The temporary password must be changed on first login. The application login and forced-password-change flow are the next Phase 1B slice.

## Verification

Database policy tests live in `supabase/tests/` and run against the local Supabase stack:

```bash
npm run supabase:test:db
```

The tests cover anonymous denial, same-family visibility, cross-family isolation, owner-only settings, member profile updates, and protected role columns.
