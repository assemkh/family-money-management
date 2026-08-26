# Refactor, Responsive, and Performance Plan

Status: implementation in progress  
Audit date: 2026-08-26  
Scope: authenticated Next.js application, Supabase data layer, responsive behavior, accessibility, loading behavior, and delivery quality  
Implementation model: five phases, with two implementation subphases in each phase

## 1. Purpose

This document turns the current application audit into an implementation roadmap. The goal is to make Family Money Management easier to maintain, faster to navigate, and dependable on phones, tablets, and desktops without changing its established financial behavior or visual identity.

The refactor must preserve these product invariants:

- Household data stays private and isolated by Supabase Row Level Security (RLS).
- Existing money calculations, immutable monthly-plan revisions, manual exchange-rate behavior, and owner/member permissions remain the source of truth.
- The current warm green, cream, terracotta, dark-mode, English, and Arabic experience remains recognizable.
- No optimization may share one household's private data with another household through a cross-request cache.
- Database changes are reproducible migrations, include allow-and-deny RLS tests, and are validated before production deployment.
- Each subphase is implemented as a reviewable change and deployed to a Vercel preview before being promoted.

## 2. Audit method and baseline

The audit covered the tracked source tree, route structure, Server and Client Component boundaries, Supabase request paths, Server Actions, loading states, responsive breakpoints, navigation, forms, dialogs, RTL behavior, accessibility affordances, and the production build. Recommendations were checked against the local Next.js 16 documentation, current Supabase guidance, React performance guidance, and current web interface accessibility guidance.

### Current repository baseline

| Measure                     |                      Current result | Meaning                                                               |
| --------------------------- | ----------------------------------: | --------------------------------------------------------------------- |
| Tracked files               |                                 170 | A moderate codebase that can still be refactored incrementally        |
| TypeScript/TSX lines        |                              17,672 | Most application behavior is type-checked                             |
| App Router pages            |                                  18 | A meaningful responsive and navigation test matrix is required        |
| Client Components           |                                  41 | Server-first rendering exists, but client boundaries need measurement |
| Exported Server Actions     |                                  34 | Shared action infrastructure will have high leverage                  |
| Unit test files             |                                  10 | Good calculation/validation foundation; browser coverage is missing   |
| Database test files         |                                  10 | RLS/database verification exists and must expand with new read models |
| Production build            | Passed in about 6.1 seconds locally | Build health is good; this is not a runtime performance measurement   |
| Raw generated client chunks |    About 901 KiB before compression | Inventory only; it is not the JavaScript loaded by any one route      |

The current scripts already provide formatting, linting, type checking, unit tests, a production build, and local Supabase database tests. Missing quality gates include authenticated browser tests, automated accessibility checks, responsive visual regression, per-route bundle budgets, Lighthouse runs, and field Core Web Vitals reporting.

### Largest concentration points

| Module                      |        Size | Audit conclusion                                                                          |
| --------------------------- | ----------: | ----------------------------------------------------------------------------------------- |
| `lib/finance/data.ts`       | 2,072 lines | Types, queries, transformations, and page orchestration are coupled in one shallow module |
| `lib/i18n/settings-copy.ts` |   888 lines | Copy, types, and feature structure have poor locality                                     |
| `app/actions/settings.ts`   |   829 lines | Repeats authentication, validation, errors, and invalidation across settings mutations    |
| `app/actions/finance.ts`    |   808 lines | Repeats action infrastructure across financial domains                                    |
| Dashboard page              |   576 lines | Fetching, calculations, and a large presentation tree cannot stream independently         |
| Reports page                |   535 lines | Filtering, read orchestration, and presentation are concentrated together                 |

Line count alone is not a reason to split a module. Refactoring is justified only where a new Module gains Depth: a small, stable Interface hides meaningful query, authorization, validation, or presentation complexity in its Implementation.

## 3. Audit findings

### Critical and high-priority findings

1. **The protected layout blocks the first useful shell.** `app/(app)/layout.tsx` awaits authentication, profile, and family locale sequentially before rendering the sidebar, header, navigation, or page. `readAuthState()` and `readCurrentProfile()` also validate claims through separate paths. A same-segment `loading.tsx` does not wrap the work awaited by that layout, so the current structure delays visible feedback.

2. **The dashboard's data path has too many network round trips.** The dashboard reads settings first and then starts 13 Supabase reads. Those reads are parallelized, which is good, but the page waits for the complete result before it can reveal any dashboard section. Reports, net worth, and monthly planning have similar multi-query fan-out at smaller scales.

3. **The finance data Module is broad but not deep.** `lib/finance/data.ts` exposes many unrelated page loaders while also owning types and transformations. Changing one domain requires navigating a 2,072-line file, reducing Locality and making independent testing harder.

4. **Server Actions repeat security and delivery behavior.** The 34 actions repeat household context resolution, owner checks, Zod error shaping, database error translation, and route revalidation. The duplication makes it easy for one mutation to invalidate an incomplete set of dependent views.

5. **Mobile and tablet navigation does not expose the full application.** Below `lg`, the five-item bottom navigation links to Dashboard, Expenses, Add Expense, Income, and Accounts. The Accounts item is visually active for many unrelated routes but only declares `aria-current` on `/accounts`. Monthly Plan, Goals, Transfers, Assets, Investments, Liabilities, Recurring, Net Worth, Reports, and Settings lack a clear mobile navigation surface.

6. **Tablet layout has no dedicated mode.** The 17.5rem desktop sidebar appears at 1024px, leaving limited content width on a landscape tablet, while all smaller widths use the phone bottom navigation. A compact tablet rail/drawer mode is needed between phone and wide desktop layouts.

### Medium-priority findings

- The mobile navigation does not account for `env(safe-area-inset-bottom)`, and the application shell uses `min-h-screen` instead of dynamic viewport units.
- Bottom-navigation labels use approximately 10.4px text and truncate localized labels, which is fragile for Arabic and user text scaling.
- The expense form uses `autoFocus`, which can open the software keyboard and move the viewport unexpectedly on mobile.
- The profile menu is a native `<details>` disclosure without an explicit Escape/outside-click/focus-return strategy. The theme control is hidden on the smallest screens and is not repeated in the menu.
- Native dialogs are a good semantic base, but their maximum height, safe-area padding, focus restoration, and unsaved-form behavior are not standardized.
- Field-level errors exist, but forms do not consistently focus the first invalid field or provide a linked error summary after a failed Server Action.
- Some dates are still rendered from raw strings instead of the centralized locale-aware date helpers.
- Dashboard and report charts provide textual labels, but a compact accessible table or equivalent detailed alternative should be available where the visual carries comparison data.
- Page heroes, cards, fields, empty states, skeletons, and repeated Tailwind class strings are implemented locally. This increases drift across 18 pages.
- The root font setup loads three families and multiple weights. It supports the brand and Arabic well, but its actual network cost has not been measured per locale.
- Route invalidation is declared action by action. Income, expense, transfer, valuation, and planning mutations need a central dependency map so Dashboard, Reports, Monthly Plan, Net Worth, and detail pages cannot diverge.

### Existing strengths to preserve

- Pages are Server Components by default, and interactive code is already isolated into Client Components.
- Most independent Supabase reads use `Promise.all` rather than avoidable sequential awaits.
- Financial calculations and validation have unit coverage.
- Supabase migrations and database tests are already part of the repository.
- Forms generally have visible labels, useful touch heights, pending states, field errors, and live success/error feedback.
- The layout includes a skip link and uses logical start/end spacing for RTL.
- Dark mode, Arabic direction, reduced-motion CSS, route loading skeletons, and custom lightweight SVG charts already exist.
- Page grids are mostly mobile-first and avoid fixed content widths.

## 4. Target architecture

The refactor should deepen the system around a few stable Seams instead of creating many pass-through files.

### Household request context

Create one server-only Module with a small Interface that resolves verified auth, current profile, household identity, locale, and messages once per request. Its Implementation hides Supabase cookie/client setup, redirects, claim validation, profile lookup, and owner enforcement.

This Seam should offer only the variants consumers need, for example authenticated and owner-required contexts. A page or action should not need to know how many underlying reads are required.

### Domain read models

Replace the single finance data file with deep Modules organized by the language of the product:

- cash flow: income, expenses, and transfers;
- planning: monthly plans, recurring commitments, and goals;
- net worth: accounts, assets, investments, liabilities, rates, and snapshots;
- dashboard and reports: composed read models built from the domain Modules;
- valuation: one shared Implementation for DZD conversions and missing-rate behavior.

Each page-facing Interface should return the complete view model needed by that page while hiding Supabase query details. The deletion test applies: if removing a proposed wrapper leaves callers just as readable, do not add it.

### Authenticated action execution

Create an authenticated-action Module that encapsulates household context, optional owner authorization, Zod parsing, normalized field errors, safe database errors, audit metadata, and declarative invalidation. Domain actions remain explicit, but their repeated infrastructure moves behind one Interface.

### Adaptive application shell and design system

Create a shared route catalog as the source of truth for desktop sidebar, tablet navigation, phone navigation, labels, icons, and active-route matching. Add a small set of deep adaptive UI primitives—page frame, hero, surface, field, feedback, empty state, dialog frame, and skeleton—only where they encode responsive, accessible, or theme behavior.

## 5. Responsive and performance targets

### Device and interaction matrix

| Mode             | Verification widths | Target behavior                                                                                               |
| ---------------- | ------------------- | ------------------------------------------------------------------------------------------------------------- |
| Small phone      | 320px and 375px     | No page-level horizontal overflow; primary actions reachable with one hand; safe-area-aware bottom navigation |
| Large phone      | 430px               | Comfortable forms/cards; localized labels do not collide                                                      |
| Portrait tablet  | 768px               | Compact rail or accessible drawer; no desktop sidebar squeeze                                                 |
| Landscape tablet | 1024px              | Useful two-column content where appropriate; compact navigation remains available                             |
| Desktop          | 1280px and 1440px   | Full sidebar and wider analytical layouts                                                                     |

Every width must be tested in English and Arabic, light and dark themes, keyboard-only operation, 200% text zoom, and reduced motion. Touch targets should be at least 44 by 44 CSS pixels unless the target is an inline text link. Page-level overflow at 320px is a release blocker; intentionally scrollable tables or charts must be labeled and contained.

### Runtime targets

The first subphase records the real baseline before optimization. The release target is:

- p75 Largest Contentful Paint at or below 2.5 seconds;
- p75 Interaction to Next Paint at or below 200 milliseconds;
- p75 Cumulative Layout Shift at or below 0.1;
- route-level loading feedback visible within 200 milliseconds in the throttled browser test;
- no new initial-route JavaScript regression larger than 10 KiB gzip without a documented exception;
- at least a 15% reduction in dashboard initial JavaScript or transferred data where the Phase 1 baseline shows a meaningful opportunity;
- no avoidable duplicate auth/profile request in one render;
- no avoidable database full scan in a common financial read, as demonstrated by `EXPLAIN (ANALYZE, BUFFERS)` against representative data;
- no performance optimization accepted solely from a local build time or raw chunk total.

## 6. Implementation roadmap

## Phase 1 — Measurement and architecture foundations

Outcome: establish trustworthy baselines and stable architecture Seams before changing runtime behavior.

### Phase 1.A — Performance, responsive, and regression baseline

**Implementation status:** Complete on 2026-08-26. The reproducible measurements,
known accessibility and overflow debt, privacy constraints, commands, generated
artifacts, and continuation notes are recorded in
[`docs/performance-baseline.md`](performance-baseline.md). Phase 1.B's first half is
now complete as well; its second half is the next implementation subphase.

**Implementation work**

- Add Playwright browser tests with authenticated owner/member fixtures that never store real credentials in the repository.
- Create a viewport matrix for 320, 375, 430, 768, 1024, 1280, and 1440 pixels.
- Add automated axe accessibility checks for login, dashboard, entry forms, reports, settings, and dialogs.
- Add Lighthouse CI or an equivalent reproducible lab run for login, dashboard, expenses, reports, and settings using throttled mobile and desktop profiles.
- Add Web Vitals reporting with route, locale, theme, and device-class dimensions but no financial values or personally identifiable information.
- Add an official Next.js-compatible bundle analyzer and record compressed initial JavaScript by route. Measure fonts separately for English and Arabic.
- Record Supabase request count and timing for Dashboard, Reports, Net Worth, Monthly Plan, and Settings. Capture representative query plans safely without logging household data.
- Save baseline screenshots in light/dark and English/Arabic for the key viewport matrix.

**Primary files and Modules**

- `package.json`
- `next.config.ts`
- `playwright.config.ts`
- `tests/e2e/`
- a small Web Vitals reporter under `components/observability/`
- `docs/performance-baseline.md`

**Acceptance criteria**

- One command runs the browser, accessibility, and viewport smoke suite locally and in CI.
- Baseline output includes per-route requests, transferred bytes, initial JavaScript, LCP, INP proxy/lab interaction timing, CLS, and screenshots.
- The measurements are reproducible and exclude secrets and household financial data.
- Existing format, lint, typecheck, unit, database, and production-build checks still pass.

### Phase 1.B — Domain map, decisions, and shared Interfaces

**Implementation status:** First half complete on 2026-08-26. The canonical domain
language, the three architecture decision records, and the mutation-to-read-model
dependency graph are written and verified. The second half — the household
request-context Interface, the authenticated-action Interface, the domain read-model
boundaries, and the ownership rules for shared valuation code — is the next
implementation step. Notes are recorded in
[Phase 1.B implementation notes](#phase-1b-implementation-notes) below.

**Implementation work**

First half — domain map and decisions (complete):

- [x] Add `CONTEXT.md` with the canonical terms Household, Member, Account, Income Entry, Expense Entry, Transfer, Savings Event, Investment Event, Monthly Plan, Net Worth Snapshot, Valuation, and Manual Exchange Rate.
- [x] Add architecture decision records for financial source-of-truth rules, authenticated server rendering/caching, and adaptive navigation/breakpoints.
- [x] Document the dependency graph from each mutation to all affected read models and routes.
- [x] Document caching policy: request-local deduplication is permitted; private cross-request cache is forbidden unless it is household-keyed, authorization-safe, bounded, and explicitly invalidated. Recorded as ADR 0002, decisions 2 and 3.

Second half — shared Interfaces (next):

- [ ] Define the household request-context Interface and authenticated-action Interface before moving call sites.
- [ ] Define the domain read-model boundaries and ownership rules for shared valuation/calculation code.

**Primary files and Modules**

- `CONTEXT.md` — written
- `docs/adr/` — `README.md` and records 0001, 0002, 0003 written
- `docs/architecture/mutation-dependency-map.md` — written
- proposed `lib/auth/household-context.ts` — second half
- proposed `lib/actions/execute-household-action.ts` — second half

**Acceptance criteria**

- Each proposed Module has a named Interface, hidden Implementation responsibility, consumers, and deletion-test rationale. — _second half_
- [x] Every financial mutation maps to Dashboard, Reports, Monthly Plan, Net Worth, and detail routes that it can affect.
- [x] The decisions state the RLS and cache-safety requirements explicitly.
- [x] No production behavior changes in this subphase.

#### Phase 1.B implementation notes

_First half, recorded 2026-08-26._

**What was delivered**

| Artifact                                                                                                            | Contents                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`CONTEXT.md`](../CONTEXT.md)                                                                                       | Canonical terms for identity, money, cash flow, planning, events, derived measures, settings keys, and the permission matrix, plus the words the product does not use |
| [`docs/adr/0001-financial-source-of-truth.md`](adr/0001-financial-source-of-truth.md)                               | Eight rules placing invariants in PostgreSQL, derivation in `lib/finance/calculations.ts`, and single ownership on stored derived state                               |
| [`docs/adr/0002-authenticated-rendering-and-cache-safety.md`](adr/0002-authenticated-rendering-and-cache-safety.md) | Nine rules on dynamic rendering, request-local memoization, the five-condition gate on any cross-request cache, and admin-client scope                                |
| [`docs/adr/0003-adaptive-navigation-and-breakpoints.md`](adr/0003-adaptive-navigation-and-breakpoints.md)           | Ten rules defining the three shell modes, the additive `shell: 1200px` screen, the route catalog, and the single active-state predicate                               |
| [`docs/architecture/mutation-dependency-map.md`](architecture/mutation-dependency-map.md)                           | All 30 mutations mapped to tables, read models, and routes, with the declared-versus-actual gap analysis                                                              |

**Findings that change later phases**

- **Eleven of the 30 mutations under-declare their invalidation.** `/net-worth` is
  missed by seven mutations, `/reports` by six. The widest single gap is
  `saveExchangeRateAction`, which changes an input to nearly every DZD Valuation but
  declares only `/accounts` and `/dashboard`.
- **The gaps are latent, not live.** The `(app)` segment is `force-dynamic` and every
  read awaits `cookies()`, so no authenticated route is cached; and Next.js 16
  documents that `revalidatePath` called from a Server Function currently refreshes
  all previously visited pages, behavior it calls temporary. Phase 4.A must land the
  declarative invalidation map before that behavior narrows.
- **Table-level reasoning is not sufficient.** Column- and filter-aware analysis
  removed false gaps on seven mutations: `/goals` and `/investments` read the same
  `financial_transactions` table under different `type` filters, `/monthly-plan` and
  `/dashboard` read different `settings` keys, and `/income` is the only read model
  that selects `profiles.is_active`. Phase 2.B read models must keep those filters
  explicit at the call site.
- **The breakpoint decision is additive.** Moving the sidebar to a new
  `shell: 1200px` screen leaves all 229 `sm:`, 33 `lg:`, and 53 `xl:` usages
  untouched, so Phase 3.A can change the shell without restyling 18 pages.
- **Three read-model defects were found and deferred to Phase 2.B:** the
  `getPortfolioPageData("investments")` branch is unreachable, `/dashboard` reads the
  `settings` table twice, and five member option lists ignore `is_active`.

**Verification**

Documentation-only subphase, so no production behavior changed. `npm run check`
(format, lint, typecheck, unit tests, production build) passes, and the tracked source
tree is unchanged apart from the new documents.

## Phase 2 — Server critical path and finance data Modules

Outcome: remove duplicated request work and reduce database/network latency while preserving RLS and financial correctness.

### Phase 2.A — Streamable authenticated shell and request context

**Implementation work**

- Implement the deep household request-context Module using request-local memoization so auth claims, profile, family ID, locale, and messages resolve once per request.
- Consolidate `readAuthState()` and `readCurrentProfile()` call paths without weakening server-side identity validation.
- Reorganize the authenticated layout so dynamic household work is as low in the tree as security permits and useful shell/loading UI can stream promptly under Next.js 16 behavior.
- Keep login, forced password change, inactive-member handling, and owner-only authorization deterministic.
- Add error boundaries for recoverable shell/profile/settings failures and preserve redirect behavior for unauthenticated users.
- Measure TTFB, first fallback, request count, and route transitions before and after the change.

**Primary files and Modules**

- `app/(app)/layout.tsx`
- `app/(app)/loading.tsx`
- `lib/auth/session.ts`
- `lib/auth/profile.ts`
- `lib/settings/data.ts`
- new household request-context Module

**Acceptance criteria**

- One protected page render performs one verified identity/profile context resolution path.
- The authenticated shell or meaningful fallback appears without waiting for unrelated page data.
- Unauthenticated, inactive, owner, member, and must-change-password scenarios pass browser and unit tests.
- No private user/household response is cached across requests.
- Measured first-fallback and server timing improve or the change is revised based on evidence.

### Phase 2.B — Domain read models and Supabase query optimization

**Implementation work**

- Extract deep cash-flow, planning, net-worth, valuation, dashboard, and reporting read-model Modules from `lib/finance/data.ts` while keeping stable page-facing return types.
- Move types beside the domain that owns them and keep truly shared money/value types in a small shared contract.
- Split Dashboard and Reports into critical-above-the-fold and secondary read models where that enables useful streaming.
- Remove broad selects and fetch only required columns, rows, months, and current plan versions.
- Compare two measured options for high-fan-out routes: fewer optimized PostgREST reads versus a database-composed read model. Choose the simpler option that meets the budget.
- For any database view, use `security_invoker = true`. Prefer security-invoker functions; do not introduce a `SECURITY DEFINER` shortcut to bypass RLS.
- Derive household scope from the authenticated database context rather than accepting an arbitrary family ID as trusted input.
- Use `EXPLAIN (ANALYZE, BUFFERS)`, representative data, index advisor/database advisors, and production-safe logs to justify indexes. Remove proposed indexes that do not improve the measured plan.
- Follow the repository's imperative migration workflow and add grants, RLS, allow/deny pgTAP coverage, and Data API exposure checks for every new database object.

**Primary files and Modules**

- `lib/finance/data.ts` (reduced to compatibility exports, then removed if the deletion test passes)
- `lib/finance/read-models/`
- `lib/finance/valuation/`
- `supabase/migrations/`
- `supabase/tests/`
- Dashboard, Reports, Monthly Plan, and Net Worth pages

**Acceptance criteria**

- No replacement file becomes another mixed-domain monolith.
- Dashboard request count and transferred rows decrease from the Phase 1 baseline, or a documented measurement explains why retaining a query is faster/safer.
- Common query plans show no avoidable scans or sorts, and write performance is not degraded by speculative indexes.
- Owner/member/non-member/anonymous database tests prove isolation for every new view or function.
- All financial totals match snapshot fixtures before and after the refactor.

## Phase 3 — Adaptive shell and responsive design system

Outcome: make every feature discoverable and comfortable on phones and tablets while preserving the established desktop identity.

### Phase 3.A — Phone, tablet, and desktop navigation shell

**Implementation work**

- Create one route-catalog Module that drives labels, icons, grouping, active matching, and permissions for every navigation surface.
- Keep the phone bottom navigation focused on frequent actions, and replace the misleading Accounts catch-all with an accessible More button and sheet containing all remaining destinations.
- Add a tablet-specific compact rail or drawer from approximately 768px through 1199px; move the full 17.5rem sidebar to a width where it does not squeeze content.
- Give the More sheet correct dialog semantics, focus trap, Escape/outside-close behavior, focus restoration, and browser-history-safe navigation.
- Add `100dvh` behavior, bottom safe-area padding, overlay compensation, and scrolling/overscroll rules for iOS and Android browser chrome.
- Increase small navigation label size and verify long English/Arabic labels at 200% text zoom.
- Make theme switching and Settings reachable at every viewport.
- Standardize active route behavior for nested destinations and `aria-current`.

**Primary files and Modules**

- `components/layout/mobile-navigation.tsx`
- `components/layout/app-sidebar.tsx`
- `components/layout/app-header.tsx`
- `app/(app)/layout.tsx`
- new route catalog and tablet/More navigation components
- `app/globals.css`

**Acceptance criteria**

- Every application destination is discoverable from phone, tablet, and desktop navigation.
- No fixed navigation obscures content or focused controls, including devices with safe-area insets.
- Keyboard and screen-reader tests cover opening, navigating, closing, and restoring focus for menus/drawers.
- The shell has no page-level horizontal overflow across the full viewport matrix in English or Arabic.
- Navigation labels remain readable at 200% text zoom.

### Phase 3.B — Responsive primitives and page-by-page adaptation

**Implementation work**

- Build deep adaptive primitives for page frame, hero, surface/card, KPI group, field, feedback, empty state, skeleton, and dialog frame where they encode meaningful accessibility/responsive behavior.
- Migrate repeated class strings incrementally; do not create a component for one-off markup or add pass-through wrappers.
- Audit all 18 pages at each target width. Prioritize Dashboard, Expenses, Income, Accounts, Monthly Plan, Goals, Reports, Net Worth, and Settings.
- Use single-column forms on small phones, introduce columns only when field labels and error text fit, and keep primary actions reachable above fixed navigation.
- Standardize contained horizontal scrolling or mobile card alternatives for wide data regions.
- Add safe truncation/wrapping for names, notes, currency totals, translated copy, and 200% text zoom.
- Remove unconditional mobile autofocus and focus the first invalid field after failed submissions.
- Standardize dialog maximum height, sticky actions where needed, safe-area spacing, dirty-form handling, and focus restoration.
- Use the centralized locale/date/money helpers everywhere; remove raw date strings and hard-coded locale formatting where inappropriate.
- Give comparison charts a concise accessible data alternative and preserve the existing lightweight SVG approach unless measurement justifies another library.

**Primary files and Modules**

- `components/ui/`
- `components/finance/`
- all authenticated route pages
- `lib/formatting/`
- `app/globals.css`

**Acceptance criteria**

- All 18 pages pass the viewport, RTL, dark-mode, text-zoom, keyboard, and automated accessibility matrix.
- Forms remain usable at 320px with the software keyboard open and errors clearly associated with fields.
- Dialogs do not exceed the visible dynamic viewport and return focus to their opener.
- Repeated responsive behavior lives behind deep primitives; feature-specific content remains local to its feature.
- Visual regression review confirms the existing brand identity is preserved.

## Phase 4 — Loading, interaction, and client performance

Outcome: reveal useful content earlier and reduce hydration, rerendering, and unnecessary transferred code.

### Phase 4.A — Granular streaming, loading, error, and URL states

**Implementation work**

- Add intentional Suspense boundaries around independent secondary dashboard/report sections after the data Modules are separated.
- Prioritize the page title, selected period, primary balance/flow summary, and primary action; stream trends, historical lists, and secondary comparisons afterward.
- Make skeleton dimensions match final cards/charts to prevent layout shift, and keep reduced-motion behavior.
- Add route-level `error.tsx` boundaries with safe retry behavior and financial-data-neutral messages.
- Preserve filters, selected month, report range, and view modes in the URL so refresh, sharing within the signed-in household, and browser Back work predictably.
- Prevent duplicate client refetches after Server Actions; rely on explicit server invalidation and navigation refresh behavior.
- Apply the mutation-to-read-model invalidation map from Phase 1 rather than scattered path guesses.

**Primary files and Modules**

- route `loading.tsx` and new `error.tsx` files
- Dashboard and Reports section components
- read-model Modules from Phase 2
- Server Action invalidation Module

**Acceptance criteria**

- Critical content appears before noncritical chart/history data on throttled tests.
- Skeleton-to-content transitions stay within the CLS budget.
- A failed secondary section does not blank the entire authenticated application when recovery is possible.
- Filters and periods survive reload and Back/Forward navigation.
- Every mutation refreshes all dependent financial views exactly as declared.

### Phase 4.B — Client boundary, rerender, bundle, and font optimization

**Implementation work**

- Re-audit all 41 Client Components and move static wrappers/labels back to Server Components where possible.
- Keep client props narrow and serializable; send prepared view data rather than broad records.
- Lazy-load genuinely noncritical, heavy interactions such as closed sheets/dialog bodies or below-fold analytical UI only when the measured bundle benefit exceeds the added complexity.
- Do not dynamically import lightweight above-the-fold SVG charts solely to increase a metric.
- Reduce controlled form state where the browser/FormData model is sufficient; retain state where fields genuinely interact.
- Stabilize expensive derived values and callbacks only where profiling shows rerenders, not through blanket memoization.
- Audit icon imports, dead code, duplicate utilities, and settings copy loading by locale/feature.
- Measure the three font families and weight files. Reduce weights/subsets or defer noncritical families only if the visual comparison and locale coverage remain acceptable.
- Add `color-scheme`/theme metadata and ensure native controls render consistently in light and dark mode.

**Primary files and Modules**

- Client Components under `components/`
- `app/layout.tsx`
- font and theme setup
- `lib/i18n/settings-copy.ts`
- `next.config.ts`

**Acceptance criteria**

- Per-route compressed JavaScript meets the Phase 1 budget and has no unexplained regression.
- Dashboard transferred data or initial JavaScript improves by the stated target where the baseline identified an opportunity.
- React profiling shows no repeated expensive render on ordinary form entry or navigation.
- English and Arabic typography remain stable with no flash-induced layout shift.
- All lazy UI is keyboard reachable and announces loading where appropriate.

## Phase 5 — Verification, hardening, and production rollout

Outcome: prove that the refactor is correct, secure, responsive, and faster before making it the production default.

### Phase 5.A — Full automated and manual quality matrix

**Implementation work**

- Run formatting, linting, type checking, unit tests, production build, local database tests, browser tests, accessibility checks, and visual regression in CI.
- Add end-to-end financial journeys for owner and member: sign in, change password, add income, add expense, transfer, plan revision, savings contribution, investment event, snapshot, report filter/export, settings update, and sign out.
- Test authorization deny paths for anonymous, unrelated authenticated user, inactive member, ordinary member, and owner.
- Test empty, normal, large, negative, missing-rate, long-name, long-note, and validation-error states.
- Test English/Arabic, light/dark, reduced motion, keyboard only, screen reader smoke, 200% text zoom, and all target viewports.
- Test Fast 4G, slow database response, offline navigation failure, and Server Action failure/retry behavior without duplicate financial records.
- Verify current Chrome, Safari, Firefox, iOS Safari, and Android Chrome behavior for fixed navigation, dialogs, date/month inputs, and software keyboards.

**Primary files and Modules**

- `tests/e2e/`
- `tests/visual/`
- `supabase/tests/`
- CI workflow configuration
- financial calculation and action tests

**Acceptance criteria**

- The complete CI matrix is green twice from a clean checkout.
- Zero critical/high automated accessibility violations remain; documented exceptions include owner and expiry date.
- RLS tests prove both allowed household collaboration and denied cross-household access.
- Financial journey assertions confirm no duplicate or changed ledger semantics.
- Manual browser/device checklist is signed off for the phone, tablet, and desktop modes.

### Phase 5.B — Performance gates, preview soak, and safe rollout

**Implementation work**

- Compare the final preview to Phase 1 using identical accounts, data volume, network profiles, regions, and viewport conditions.
- Make Core Web Vitals, per-route bundle budgets, accessibility, and responsive screenshot diffs blocking checks for future pull requests.
- Run Supabase database advisors, review slow queries and RLS/grants, and verify migration history before production.
- Soak the Vercel preview with realistic household workflows and monitor errors, Web Vitals, Supabase request latency, and failed actions without logging financial values.
- Back up production, verify rollback commands, and prepare an application rollback plus forward-only database recovery plan.
- Promote one reviewed subphase at a time or use a feature flag for the new navigation/read models where practical.
- Verify the production deployment at the public URL after promotion, then compare field metrics for at least one normal usage period.
- Update architecture, operational, testing, and contributor documentation to match the final Implementation.

**Primary files and Modules**

- CI performance configuration
- Vercel project checks and observability
- Supabase migrations/advisor output
- `docs/architecture/`, `docs/adr/`, and deployment runbook

**Acceptance criteria**

- Final measured LCP, INP, CLS, bundle, request-count, and query-plan targets pass or have an explicit approved exception.
- Production RLS, grants, migration history, environment variables, and deployment commit are verified.
- Error and failed-action rates do not regress during the preview soak or production verification.
- Rollback is documented and does not require destructive database commands.
- The implementation is complete only when production monitoring confirms the preview result.

## 7. Sequencing and risk controls

The phases are ordered deliberately. Measurement precedes optimization; request and data Seams precede responsive page migration; responsive primitives precede client bundle trimming; and all work precedes production promotion.

The following controls apply throughout:

- Keep each subphase independently reviewable and avoid mixing schema, architecture, and broad visual rewrites in one commit.
- Use preview deployments for every subphase and never use real household records in screenshots or performance fixtures.
- Add characterization tests before moving financial calculations or query transformations.
- Treat RLS, grants, authorization, and cache scope as release-blocking security properties.
- Benchmark before adding an index, database function, dynamic import, memoization, or persistent cache.
- Preserve unrelated user changes in the working tree and avoid mass mechanical rewrites.
- Remove compatibility exports once all consumers move; a refactor that only adds layers without deleting obsolete structure is incomplete.

## 8. Final definition of done

This plan is complete when:

- all ten implementation subphases meet their acceptance criteria;
- every application route is usable and discoverable on phone, tablet, and desktop;
- English, Arabic, dark mode, reduced motion, keyboard use, and 200% text zoom pass the defined matrix;
- Core Web Vitals and route bundle budgets are measured and enforced;
- duplicated auth/profile work and avoidable dashboard query fan-out are removed or justified by evidence;
- finance data and actions are organized behind deep domain Interfaces with better Locality;
- Supabase RLS/grants and financial totals are proven unchanged or intentionally migrated through tests;
- preview and production verification show no correctness, security, or performance regression.
