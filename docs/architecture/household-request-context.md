# Module: household request context

**Proposed file:** `lib/auth/household-context.ts`
**Status:** Interface specified in Phase 1.B; implemented in Phase 2.A
**Terms:** [`CONTEXT.md`](../../CONTEXT.md)
**Governed by:** [ADR 0002](../adr/0002-authenticated-rendering-and-cache-safety.md)

One server-only Module that resolves verified identity, Household, role, locale,
messages, and the RLS-scoped database client **once per request**. Its Interface is
three functions; its Implementation hides four Supabase round trips and three
failure branches that are currently open-coded at 49 call sites.

## The problem it removes

Identity is resolved along two paths that do not know about each other.
`readAuthState()` in [`lib/auth/session.ts`](../../lib/auth/session.ts) calls
`getClaims()`. `readCurrentProfile()` in
[`lib/auth/profile.ts`](../../lib/auth/profile.ts) calls `getClaims()` **again**, then
reads `profiles`. Both are memoized with React `cache()`, so each is deduplicated
individually — but they duplicate each other.

The protected layout then awaits three things in sequence before rendering anything:

```ts
const authState = await readAuthState(); // getClaims()
const profile = await readCurrentProfile(); // getClaims() + profiles
const locale = await getFamilyLocale(profile.familyId); // families
```

Below the layout, the same preamble is repeated by every read model — 14 times in
[`lib/finance/data.ts`](../../lib/finance/data.ts) and once in
[`lib/settings/data.ts`](../../lib/settings/data.ts):

```ts
const profile = await readCurrentProfile();
if (!profile) return null;
const supabase = await createClient();
```

And again, in a third shape, by every mutation — `readActionContext()` 16 times in
[`app/actions/finance.ts`](../../app/actions/finance.ts) and `readOwnerContext()` 13
times in [`app/actions/settings.ts`](../../app/actions/settings.ts), each
re-implementing the claims read, the profile read, the `must_change_password` refusal,
and — in the settings copy — the Owner check.

There are 25 `await createClient()` call sites. Every one of them constructs a
Supabase server client that the request has already built.

## Interface

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/types";

export type HouseholdMember = {
  readonly id: string;
  readonly displayName: string;
  readonly username: string;
  readonly role: "owner" | "member";
  readonly mustChangePassword: boolean;
};

export type HouseholdContext = {
  /** Verified Supabase Auth user id. */
  readonly userId: string;
  /** The Household this request acts within. Never accepted as input. */
  readonly householdId: string;
  readonly member: HouseholdMember;
  readonly locale: Locale;
  readonly direction: "ltr" | "rtl";
  readonly messages: Messages;
  /** RLS-scoped client bound to this request's cookies. */
  readonly db: SupabaseClient;
};

/**
 * Non-throwing probe. Returns null when the caller is not a signed-in Member of a
 * Household. Callers decide their own failure shape.
 */
export function readHouseholdContext(): Promise<HouseholdContext | null>;

/**
 * Render-path variant. Redirects to /login when anonymous and to /change-password
 * when the Member must replace their password. Never returns a partial context.
 */
export function requireHouseholdContext(): Promise<HouseholdContext>;

/**
 * Render-path variant with Owner authorization. Same redirects, plus a FORBIDDEN
 * AppError when the Member is not the Household Owner.
 */
export function requireOwnerContext(): Promise<HouseholdContext>;
```

Three variants, because three consumer shapes exist and no more:

| Variant                   | Consumer shape                                                   | Why it cannot use another variant                         |
| ------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- |
| `readHouseholdContext`    | `/reports/export` Route Handler; the authenticated-action Module | Must answer `401` or an action error state, not redirect  |
| `requireHouseholdContext` | The protected layout, every page, every read model               | Redirecting is the correct App Router response mid-render |
| `requireOwnerContext`     | Owner-only settings surfaces                                     | Authorization must fail before any Owner-only read runs   |

No options bag, no builder, no `{ requireOwner?: boolean }` flag. A boolean parameter
that changes whether a function can throw is the shape this Interface exists to avoid.

## Hidden Implementation responsibility

The Implementation owns, and callers never see:

1. Supabase server client construction with the request cookie adapter.
2. One `getClaims()` verification per request, replacing the current two paths.
3. One `profiles` read for id, Household, display name, username, role, and
   `must_change_password`.
4. One `families` read for locale, and the message dictionary and text direction
   derived from it.
5. Request-local memoization with React `cache()`, so all three variants and every
   call site share one resolution.
6. The redirect decisions for anonymous and must-change-password callers.
7. The Owner refusal.
8. The distinction between _anonymous_ (no valid claims) and _unavailable_ (Supabase
   unreachable or unconfigured), which today lives in `AuthState` and must not be
   collapsed into a single null by this refactor.

## Consumers

| Consumer                                                         | Count | Uses                                                      |
| ---------------------------------------------------------------- | ----: | --------------------------------------------------------- |
| `app/(app)/layout.tsx`                                           |     1 | `requireHouseholdContext`                                 |
| Read models in `lib/finance/data.ts`                             |    14 | `requireHouseholdContext`                                 |
| `lib/settings/data.ts`                                           |     1 | `requireHouseholdContext` / `requireOwnerContext`         |
| Mutations via the action Module                                  |    29 | `readHouseholdContext`                                    |
| `app/(app)/reports/export/route.ts`                              |     1 | `readHouseholdContext`                                    |
| `app/(auth)/login`, `app/(auth)/change-password`, `app/page.tsx` |     3 | `readHouseholdContext` — these decide their own redirects |

## Deletion test

**Would removing this Module leave callers just as readable?** No.

Delete it and every one of the 49 call sites returns to writing its own preamble. The
read models go back to a three-line prologue and a `null` return that each page must
then re-check; the actions go back to two near-identical private context readers that
have already drifted — `readActionContext()` and `readOwnerContext()` differ only in
one role comparison, and are 20 lines apart in behavior across two files. The two
`getClaims()` paths return, because nothing would own collapsing them.

The Module is kept because it hides real complexity behind a small Interface. Three
things that would _fail_ the same test, and are therefore **not** proposed:

- A `getHouseholdId()` convenience wrapper. `context.householdId` is already one
  property access; a function around it adds a name to learn and hides nothing.
- A `lib/auth/index.ts` barrel re-exporting session, profile, and context. Callers
  import from the module that owns the thing; a barrel only adds an indirection.
- A `withHousehold(handler)` higher-order wrapper for pages. Pages already start with
  one `await`; wrapping them would obscure where the render begins.

## Rules this Module must hold

- **No cross-request cache.** React `cache()` only. See ADR 0002, decisions 2 and 3.
- **Household comes from the session.** `householdId` is derived from the verified
  profile. The Module exposes no parameter that could override it.
- **`db` is RLS-scoped.** The Module never returns the admin client. Auth
  administration keeps constructing `createAdminClient()` explicitly at its six call
  sites, so a reader can see when RLS is being bypassed.
- **Verification is not weakened.** Collapsing the two identity paths keeps
  server-side claim validation plus the profile read. Trusting a cookie is not a
  permitted simplification.
- **Redirect behavior is preserved exactly.** Anonymous → `/login`;
  `must_change_password` → `/change-password`; non-Owner on an Owner surface →
  refusal. Phase 2.A must prove these with browser tests before and after.

## What Phase 2.A must measure

`readAuthState()` and `readCurrentProfile()` are removed only once every call site
moves; leaving both alongside the new context would create a third path.

The recorded dashboard baseline is 16 Supabase requests
([`docs/performance-baseline.md`](../performance-baseline.md)). Phase 2.A must
re-record that count and the first-fallback timing after this Module lands, and revise
the change if either regresses.
