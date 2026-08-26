# 0002 — Authenticated rendering and cache safety

**Status:** Accepted
**Date:** 2026-08-26
**Context:** Phase 1.B of [`docs/refactor_responsive_perofrmance_plan.md`](../refactor_responsive_perofrmance_plan.md)
**Terms:** [`CONTEXT.md`](../../CONTEXT.md)

## Context

Every authenticated surface renders one Household's private money. Phase 2 will
restructure the protected layout for streaming, memoize the request context, and
reduce Supabase fan-out — three changes that all move in the direction of "render
less work per request", and therefore all pass close to "reuse a result across
requests". One accidental cross-request reuse would show one household another
household's numbers. That is the single worst failure this codebase can produce, and
it would not throw.

What is true today:

- `next.config.ts` does **not** enable `cacheComponents`, so the project is on the
  previous caching model documented in Next.js 16's
  `caching-without-cache-components` guide. `dynamic`, `revalidate`, and `fetchCache`
  route segment config remain available and meaningful.
- [`app/(app)/layout.tsx`](<../../app/(app)/layout.tsx>) exports
  `dynamic = "force-dynamic"`, and every authenticated read reaches Supabase through
  `createClient()`, which awaits `cookies()`. Authenticated routes are therefore
  rendered per request for two independent reasons. Neither should be removed
  casually; each is a backstop for the other.
- `unstable_cache` appears nowhere in the repository. No `fetch` in a read path opts
  into `force-cache`. There is no persistent cache of household data to leak from.
- Request-local memoization is already in use and is safe: `readAuthState()` and
  `readCurrentProfile()` in [`lib/auth/session.ts`](../../lib/auth/session.ts) and
  [`lib/auth/profile.ts`](../../lib/auth/profile.ts) are wrapped in React `cache()`,
  which lives and dies with one request.
- Identity is nonetheless resolved along two paths. `readAuthState()` calls
  `getClaims()`; `readCurrentProfile()` calls `getClaims()` _again_ and then reads
  `profiles`. The protected layout awaits both sequentially, then awaits
  `getFamilyLocale()`, before rendering anything. The Phase 1.A trace recorded 16
  Supabase requests for the dashboard, including settings read twice.
- `revalidatePath` is the only invalidation primitive used. Next.js documents that,
  called from a Server Function, it "currently also causes all previously visited
  pages to refresh when navigated to again", and that "this behavior is temporary and
  will be updated in the future to apply only to the specific path."
- `createAdminClient()` uses the secret key and bypasses RLS entirely. It is used at
  exactly six call sites across three action files, always for Auth administration or
  an Owner-gated profile write — never to read financial data.

The last two points matter together: today's declared-path gaps in
[`docs/architecture/mutation-dependency-map.md`](../architecture/mutation-dependency-map.md)
are masked by the broad refresh behavior, and will stop being masked when Next.js
narrows it.

## Decision

**1. Authenticated routes render per request. No private response is cached across
requests.** The `(app)` segment stays dynamic. Removing `force-dynamic` requires this
ADR to be superseded, not a commit message.

**2. Request-local memoization is the permitted optimization, and the preferred one.**
React `cache()` is scoped to a single render pass; two calls in one request share a
result, two requests share nothing. Phase 2's household request context must be built
on it. Deduplicating the repeated `getClaims()` and profile reads is exactly the win
this ADR intends to enable.

**3. A cross-request cache of household-derived data is forbidden by default.**
It may be introduced only when **all** of the following hold, and only in a change
that says so explicitly:

- the cache key includes the Household ID, so two Households cannot collide;
- the cached value contains nothing the caller is not already authorized to read,
  and authorization is re-checked on every read rather than implied by a cache hit;
- the entry is bounded in size and lifetime;
- every mutation that can change the value invalidates it explicitly, per the
  mutation dependency map;
- an allow-and-deny test proves a second Household cannot observe the first's entry.

"It is only the locale" is not an exemption. A Household ID is itself household data.

**4. Identity is verified server-side on every protected render.**
Verification means `getClaims()` (or an equivalently verified path) plus the
`profiles` row that establishes Household and role. A cookie's presence is not
identity. The request proxy in [`lib/supabase/proxy.ts`](../../lib/supabase/proxy.ts)
refreshes sessions and performs a coarse redirect; it is a convenience layer, and
never the authorization decision. Pages and actions re-verify.

**5. One protected render resolves identity once.**
Phase 2 collapses `readAuthState()` and `readCurrentProfile()` into one memoized
context that yields verified claims, profile, Household ID, role, locale, and
messages. Consolidation must not weaken verification: the surviving path still
validates claims server-side and still reads the profile through RLS.

**6. Redirect behavior is part of the contract, not an implementation detail.**
Unauthenticated → `/login`. Authenticated with `must_change_password` →
`/change-password`. Inactive Member → refused at the database on every financial
write. Owner-only actions → refused with an authorization error, never a silent
no-op. These five outcomes stay deterministic through any layout restructuring and
are covered by browser tests.

**7. The admin client is for Auth administration only.**
`createAdminClient()` bypasses RLS. It may create or ban an Auth user, set a
temporary password, resolve a username to an email at sign-in, or write an
Owner-gated profile column. It must never serve a page read, and its result must
never be cached anywhere.

**8. Invalidation is declared from the dependency map, not guessed per action.**
Every mutation declares the read models it can affect, from
[`docs/architecture/mutation-dependency-map.md`](../architecture/mutation-dependency-map.md).
Correctness must not depend on `revalidatePath`'s current broad refresh behavior,
which Next.js documents as temporary.

**9. Nothing household-identifying enters a shared observability path.**
Web Vitals carry route, locale, theme, and device class only. The Supabase trace
retains method, status, duration, and a sanitized resource. No IDs, names, notes,
amounts, query strings, or bodies.

## Consequences

- Authenticated routes cannot be served from a CDN or a full-route cache. This is
  accepted; the performance budget is met by removing duplicate work per request and
  by streaming, not by reuse across requests.
- Per-request work is the thing to optimize, which points Phase 2 at exactly the
  right target: one identity resolution, fewer Supabase round trips, and useful shell
  UI before page data resolves.
- Declaring invalidation per mutation is more verbose than relying on the broad
  refresh. It is also the only version that survives the documented Next.js change.
- Every proposal to "just cache this" now has a checklist to fail against, which is
  cheaper than re-arguing it.

## Rejected alternatives

**Cache the household locale or settings across requests.** Tempting: small, rarely
changed, read on every render. Rejected as the default because it establishes the
pattern, and the next thing cached would be a balance. Permitted only under the
five-condition gate above.

**Trust the proxy for authorization.** It already calls `getClaims()`, so re-checking
looks redundant. Rejected: proxy matchers are configuration, and a matcher edit would
silently un-protect a route. Fail-closed verification stays in the render path.

**Rely on `revalidatePath`'s current broad refresh.** It works today and it hides
every gap in the map. Rejected because Next.js documents it as temporary; correctness
would then depend on an implementation detail scheduled for change.

**Adopt Cache Components (`cacheComponents`) now.** A genuine future option and a
better long-term model for streaming a shell around private data. Rejected for this
refactor: it changes route segment semantics repository-wide, in the same phases that
are already restructuring the layout and the data layer. It deserves its own ADR,
after Phase 2 measurements exist.

## Verification

- `next.config.ts` does not enable `cacheComponents` without superseding this record.
- `app/(app)/layout.tsx` still exports `dynamic = "force-dynamic"`.
- `grep -rn "unstable_cache\|force-cache\|revalidate =" app lib` returns no household
  read path.
- React `cache()` usage stays confined to request-scoped resolution.
- Browser tests cover unauthenticated, must-change-password, inactive Member,
  Member, and Owner outcomes.
- Every mutation's declared invalidation matches the dependency map.
- No household identifier or financial value appears in a Web Vitals or trace payload.
