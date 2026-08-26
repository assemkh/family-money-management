# Mutation dependency map

Every financial and settings mutation, the tables it writes, the read models those
writes reach, and the routes that must therefore refresh.

Produced in Phase 1.B of
[`docs/refactor_responsive_perofrmance_plan.md`](../refactor_responsive_perofrmance_plan.md).
Terms are defined in [`CONTEXT.md`](../../CONTEXT.md); the invalidation rule this map
serves is [ADR 0002](../adr/0002-authenticated-rendering-and-cache-safety.md).
No production behavior changed in the subphase that produced it.

## Why this exists

Invalidation is currently declared action by action, as a hand-written list of
`revalidatePath` calls. Eleven of the 30 mutations declare a set narrower than the
read models they actually affect. Nothing is visibly broken today, because two
unrelated properties mask it — and one of them is documented as temporary.

This map is the input to the Phase 2 invalidation Module: an action declares the
**read models** it touches, and the map resolves those to routes. That removes the
per-action guess that produced the gaps below.

## How this map was derived

For each mutation: the tables and columns written, taken from
[`app/actions/finance.ts`](../../app/actions/finance.ts),
[`app/actions/settings.ts`](../../app/actions/settings.ts), and the bodies of the
`private.*` functions behind each RPC in `supabase/migrations/`. For each read model:
the tables, columns, and filters read, taken from
`lib/finance/data.ts` and
[`lib/settings/data.ts`](../../lib/settings/data.ts).

The join is **column- and filter-aware, not table-aware**. Three examples of why that
matters:

- `/investments` reads `financial_transactions` filtered to `type = 'investment'`, so
  a Savings Event does not affect it, even though both write the same table.
- `/monthly-plan` reads only the `allocation.defaults` settings row, so a dashboard
  preferences change does not affect it.
- `/income` is the only read model selecting `profiles.is_active`, so pausing Member
  access does not affect the other member lists — they select `display_name` alone.

A table-level join would have reported false gaps on seven further mutations —
sixteen route entries that do not, in fact, go stale. None of them appears below.

## Why the gaps are latent today

Two properties currently hide them:

1. **Authenticated routes are not cached.** `app/(app)/layout.tsx` exports
   `dynamic = "force-dynamic"`, and every read reaches Supabase through
   `createClient()`, which awaits `cookies()`. There is no server-side full-route
   cache entry to go stale. `/reports/export` is a Route Handler that also exports
   `force-dynamic`, so it is always computed fresh and never needs invalidation — it
   is listed below for completeness and excluded from every gap count.
2. **`revalidatePath` currently over-delivers.** Next.js 16 documents that, called
   from a Server Function, it "currently also causes all previously visited pages to
   refresh when navigated to again", and that "this behavior is temporary and will be
   updated in the future to apply only to the specific path."

So the declared paths do not currently have to be complete. When Next.js narrows that
behavior, or if any phase introduces caching, every gap below becomes a household
looking at a stale number — silently, with no error. That is the failure mode this
map exists to prevent.

## Read models and their inputs

| Read model                               | Route             | Tables read                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `getIncomePageData`                      | `/income`         | `profiles` (incl. `is_active`), `income_sources`, `income_entries`                                                                                                                                                                                                                                                 |
| `getExpensePageData`                     | `/expenses`       | `profiles`, `expense_categories`, `accounts`, `expense_entries`                                                                                                                                                                                                                                                    |
| `getAccountsPageData`                    | `/accounts`       | `accounts`, `exchange_rates`                                                                                                                                                                                                                                                                                       |
| `getTransfersPageData`                   | `/transfers`      | `accounts`, `transfers`                                                                                                                                                                                                                                                                                            |
| `getPortfolioPageData("assets")`         | `/assets`         | `assets`                                                                                                                                                                                                                                                                                                           |
| `getInvestmentPageData`                  | `/investments`    | `investments`, `financial_transactions` (`type='investment'`), `profiles`                                                                                                                                                                                                                                          |
| `getLiabilitiesPageData`                 | `/liabilities`    | `liabilities`                                                                                                                                                                                                                                                                                                      |
| `getRecurringPageData`                   | `/recurring`      | `recurring_transactions`, `expense_categories`                                                                                                                                                                                                                                                                     |
| `getMonthlyPlanPageData`                 | `/monthly-plan`   | `monthly_plans`, `monthly_plan_versions`, `profiles`, `income_entries`, `exchange_rates`, `settings` (`allocation.defaults`)                                                                                                                                                                                       |
| `getSavingsGoalsPageData`                | `/goals`          | `savings_goals`, `financial_transactions` (`type='saving'`), `profiles`                                                                                                                                                                                                                                            |
| `getDashboardPageData`                   | `/dashboard`      | `settings` (`dashboard.preferences`, `financial_health.thresholds`), `income_entries`, `expense_entries`, `financial_transactions` (`saving`+`investment`), `savings_goals`, `monthly_plans`, `monthly_plan_versions`, `exchange_rates`, `accounts`, `assets`, `investments`, `liabilities`, `net_worth_snapshots` |
| `getNetWorthPageData`                    | `/net-worth`      | `accounts`, `assets`, `investments`, `liabilities`, `exchange_rates`, `net_worth_snapshots`                                                                                                                                                                                                                        |
| `getReportsPageData`                     | `/reports`        | `income_entries`, `expense_entries`, `financial_transactions` (`saving`+`investment`), `monthly_plans`, `monthly_plan_versions`, `exchange_rates`, `net_worth_snapshots`, `profiles`                                                                                                                               |
| `getReportActivityExportData`            | `/reports/export` | `income_entries`, `expense_entries`, `financial_transactions`, `profiles` — always dynamic                                                                                                                                                                                                                         |
| `getSettingsPageData`                    | `/settings`       | `families`, `profiles`, `settings` (all three keys), `exchange_rates`, `expense_categories`, `income_sources`                                                                                                                                                                                                      |
| `readCurrentProfile` + `getFamilyLocale` | `(app)` layout    | `profiles`, `families`                                                                                                                                                                                                                                                                                             |

## Table to route index

| Table                                       | Routes that read it                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `families`                                  | every authenticated route (locale and direction, via the layout), `/settings`                      |
| `profiles` — `display_name`, membership     | `/income`, `/expenses`, `/investments`, `/monthly-plan`, `/goals`, `/reports`, `/settings`, layout |
| `profiles` — `is_active`                    | `/income`, `/settings`                                                                             |
| `profiles` — `must_change_password`, `role` | layout redirect, `/settings`                                                                       |
| `income_sources`                            | `/income`, `/settings`                                                                             |
| `income_entries`                            | `/income`, `/monthly-plan`, `/dashboard`, `/reports`                                               |
| `expense_categories`                        | `/expenses`, `/recurring`, `/settings`                                                             |
| `expense_entries`                           | `/expenses`, `/dashboard`, `/reports`                                                              |
| `accounts` — `current_balance`              | `/accounts`, `/expenses`, `/transfers`, `/dashboard`, `/net-worth`                                 |
| `transfers`                                 | `/transfers`                                                                                       |
| `exchange_rates`                            | `/accounts`, `/monthly-plan`, `/dashboard`, `/net-worth`, `/reports`, `/settings`                  |
| `assets`                                    | `/assets`, `/dashboard`, `/net-worth`                                                              |
| `investments`                               | `/investments`, `/dashboard`, `/net-worth`                                                         |
| `liabilities`                               | `/liabilities`, `/dashboard`, `/net-worth`                                                         |
| `recurring_transactions`                    | `/recurring`                                                                                       |
| `monthly_plans`, `monthly_plan_versions`    | `/monthly-plan`, `/dashboard`, `/reports`                                                          |
| `savings_goals`                             | `/goals`, `/dashboard`                                                                             |
| `financial_transactions` — `saving`         | `/goals`, `/dashboard`, `/reports`                                                                 |
| `financial_transactions` — `investment`     | `/investments`, `/dashboard`, `/reports`                                                           |
| `net_worth_snapshots`                       | `/net-worth`, `/dashboard`, `/reports`                                                             |
| `settings` — `allocation.defaults`          | `/monthly-plan`, `/settings`                                                                       |
| `settings` — `dashboard.preferences`        | `/dashboard`, `/settings`                                                                          |
| `settings` — `financial_health.thresholds`  | `/dashboard`, `/settings`                                                                          |

## Cash flow mutations

### `createIncomeEntryAction`

- **Writes:** `income_entries`
- **Affects:** `/income`, `/monthly-plan`, `/dashboard`, `/reports`
- **Declares:** `/income`, `/dashboard`
- **Gap:** `/monthly-plan`, `/reports`

`/monthly-plan` derives planned amounts from the month's income; `/reports` charts
income by month. Both go stale.

### `createExpenseEntryAction`

- **Writes:** `expense_entries`; `accounts.current_balance` when an Account is
  selected — atomically, via `record_expense`
- **Affects:** `/expenses`, `/dashboard`, `/reports`, and when an Account is debited
  `/accounts`, `/transfers`, `/net-worth`
- **Declares:** `/expenses`, `/accounts`, `/dashboard`
- **Gap:** `/reports`, `/transfers`, `/net-worth`

### `setAccountBalanceAction`

- **Writes:** `accounts.current_balance` via `set_account_balance`
- **Affects:** `/accounts`, `/expenses`, `/transfers`, `/dashboard`, `/net-worth`
- **Declares:** `/accounts`, `/expenses`, `/transfers`, `/dashboard`
- **Gap:** `/net-worth`

### `createTransferAction`

- **Writes:** `transfers`; both Accounts' `current_balance` — atomically, via
  `record_transfer`
- **Affects:** `/transfers`, `/accounts`, `/expenses`, `/dashboard`, `/net-worth`
- **Declares:** `/accounts`, `/transfers`, `/dashboard`
- **Gap:** `/expenses`, `/net-worth`

A Transfer is not spending ([ADR 0001](../adr/0001-financial-source-of-truth.md)); it
reaches `/expenses` only because that page lists Account balances for payment
selection.

### `saveExchangeRateAction`

- **Writes:** `exchange_rates`
- **Affects:** `/accounts`, `/monthly-plan`, `/dashboard`, `/net-worth`, `/reports`,
  `/settings`
- **Declares:** `/accounts`, `/dashboard`
- **Gap:** `/monthly-plan`, `/net-worth`, `/reports`, `/settings`

The widest gap in the map. A Manual Exchange Rate is an input to every DZD Valuation,
so it changes almost every total in the product. Existing Net Worth Snapshots keep
their captured `rates_snapshot` and are correctly unaffected.

## Portfolio and liability mutations

### `createAssetAction` / `createInvestmentAction` / `createLiabilityAction`

- **Writes:** `assets` / `investments` / `liabilities`
- **Affects:** `/assets` · `/investments` · `/liabilities`, plus `/dashboard` and
  `/net-worth` in every case
- **Declares:** its own page and `/dashboard`
- **Gap:** `/net-worth` in all three

Net worth is exactly Accounts + Assets + Investments − Liabilities. Every mutation
that changes a component of that sum must reach `/net-worth`; none of these three do.

### `recordInvestmentEventAction`

- **Writes:** `financial_transactions` (`type='investment'`), `investments.current_value`
- **Affects:** `/investments`, `/dashboard`, `/reports`, `/net-worth`
- **Declares:** `/investments`, `/dashboard`, `/reports`, `/net-worth`
- **Gap:** none — the only complete financial declaration in the map

It does **not** affect `/goals`: that page filters `financial_transactions` to
`type = 'saving'`.

### `captureNetWorthSnapshotAction`

- **Writes:** `net_worth_snapshots`
- **Affects:** `/net-worth`, `/reports`, `/dashboard`
- **Declares:** `/net-worth`, `/reports`, `/dashboard`
- **Gap:** none

## Planning mutations

### `saveMonthlyPlanAction`

- **Writes:** `monthly_plans`, `monthly_plan_versions` — appends a Monthly Plan
  Revision and advances the pointer atomically, via `save_monthly_plan`
- **Affects:** `/monthly-plan`, `/dashboard`, `/reports`
- **Declares:** `/monthly-plan`, `/dashboard`
- **Gap:** `/reports`

`/reports` computes plan variance from the active Revision.

### `createSavingsGoalAction` / `setSavingsGoalStatusAction`

- **Writes:** `savings_goals`
- **Affects:** `/goals`, `/dashboard`
- **Declares:** `/goals`, `/dashboard`
- **Gap:** none

### `recordSavingContributionAction`

- **Writes:** `financial_transactions` (`type='saving'`), `savings_goals.current_amount`
- **Affects:** `/goals`, `/dashboard`, `/reports`
- **Declares:** `/goals`, `/dashboard`
- **Gap:** `/reports`

Saving rate is a reported measure. It does **not** affect `/investments`, which
filters to `type = 'investment'`.

### `createRecurringAction`

- **Writes:** `recurring_transactions`
- **Affects:** `/recurring`
- **Declares:** `/recurring`
- **Gap:** none

A Recurring Commitment is a reminder that posts nothing, so it correctly reaches no
financial total.

## Household and settings mutations

### `createHouseholdMemberAction` — Owner only

- **Writes:** a `profiles` row (via the admin client), `income_sources.owner_member_id`
- **Affects:** `/income`, `/settings`, `/expenses`, `/investments`, `/monthly-plan`,
  `/goals`, `/reports`
- **Declares:** `/income`, `/settings`
- **Gap:** `/expenses`, `/investments`, `/monthly-plan`, `/goals`, `/reports`

Seven read models render a member list. A new Member is missing from five of them
until something else refreshes the page.

### `setMemberActiveAction` — Owner only

- **Writes:** `profiles.is_active`; bans or unbans the Auth user
- **Affects:** `/income`, `/settings`
- **Declares:** `/income`, `/settings`
- **Gap:** none

Correct, because `/income` is the only read model that selects `is_active`. See the
separate finding below — the other member lists ignore the column entirely, which is
a read-model defect rather than an invalidation one.

### `resetMemberPasswordAction` — Owner only

- **Writes:** `profiles.must_change_password`; sets a temporary Auth password
- **Affects:** `/settings`, and that Member's next protected render, which redirects
  to `/change-password`
- **Declares:** `/settings`
- **Gap:** none — the redirect is enforced in the layout on every request

### `updateMemberProfileAction` — Owner only

- **Writes:** `profiles.display_name`
- **Affects:** `/income`, `/expenses`, `/investments`, `/monthly-plan`, `/goals`,
  `/reports`, `/settings`, and the header
- **Declares:** `revalidatePath("/", "layout")` and `/settings`
- **Gap:** none — the layout-scoped call covers every nested route

### `updateFamilySettingsAction` — Owner only

- **Writes:** `families` (name, base currency, timezone, locale, date format)
- **Affects:** every authenticated route — locale and direction come from the layout
- **Declares:** `revalidatePath("/", "layout")` and `/settings`
- **Gap:** none

### `updateAllocationDefaultsAction` — Owner only

- **Writes:** `settings` key `allocation.defaults`
- **Affects:** `/settings`, `/monthly-plan`
- **Declares:** `/settings`, `/monthly-plan`
- **Gap:** none — `/dashboard` does not read this key

### `updateFinancialHealthSettingsAction` — Owner only

- **Writes:** `settings` key `financial_health.thresholds`
- **Affects:** `/settings`, `/dashboard`
- **Declares:** `/settings`, `/dashboard`
- **Gap:** none

### `updateDashboardPreferencesAction` — Owner only

- **Writes:** `settings` key `dashboard.preferences`
- **Affects:** `/settings`, `/dashboard`
- **Declares:** `/settings`, `/dashboard`
- **Gap:** none

### `createExpenseCategoryAction` / `updateExpenseCategoryAction` / `setExpenseCategoryActiveAction` — Owner only

- **Writes:** `expense_categories`
- **Affects:** `/settings`, `/expenses`, `/recurring`
- **Declares:** `/settings`, `/expenses`, `/recurring`
- **Gap:** none

### `createIncomeSourceAction` / `updateIncomeSourceAction` / `setIncomeSourceActiveAction` — Owner only

- **Writes:** `income_sources`
- **Affects:** `/settings`, `/income`
- **Declares:** `/settings`, `/income`
- **Gap:** none

### `revokeOtherSessionsAction`

- **Writes:** nothing in the database; revokes other Auth sessions
- **Affects:** no read model
- **Declares:** nothing
- **Gap:** none

## Authentication actions

`loginAction`, `changePasswordAction`, and `logoutAction` redirect rather than
revalidate, and `forgotPasswordAction` returns a status. Redirect-driven navigation
renders the destination fresh under the dynamic `(app)` segment, so no invalidation
declaration is required. `changePasswordAction` clears `must_change_password`; the
layout re-reads the profile on the next request and stops redirecting.

## Gap summary

Eleven mutations under-declare. Ranked by how many routes go stale:

| Mutation                         | Routes not declared |
| -------------------------------- | ------------------: |
| `createHouseholdMemberAction`    |                   5 |
| `saveExchangeRateAction`         |                   4 |
| `createExpenseEntryAction`       |                   3 |
| `createTransferAction`           |                   2 |
| `createIncomeEntryAction`        |                   2 |
| `setAccountBalanceAction`        |                   1 |
| `createAssetAction`              |                   1 |
| `createInvestmentAction`         |                   1 |
| `createLiabilityAction`          |                   1 |
| `saveMonthlyPlanAction`          |                   1 |
| `recordSavingContributionAction` |                   1 |

`/net-worth` is the most frequently missed route — seven mutations change one of its
four components without declaring it. `/reports` is second, at six.

## What Phase 2 and Phase 4 must do with this

1. Actions declare **read models**, not paths. The invalidation Module owns the
   read-model-to-route resolution, using the two index tables above.
2. The mapping lives beside the read models. When a Phase 2 read model gains or drops
   a table, its declared inputs change in the same commit, and every dependent
   mutation follows automatically. That is the property the current hand-written
   lists cannot have.
3. The map is testable. A unit test can assert that each mutation's declared read
   models cover every table and filter it writes, so a future action cannot
   under-declare silently. This is the durable version of the audit above.
4. Do not "fix" the eleven gaps by adding more `revalidatePath` lines. That
   reproduces the failure mode one round later. Fix the mechanism.

## Related read-model findings

Found while deriving the map. None is an invalidation defect; all belong to Phase 2.B.

- **`getPortfolioPageData("investments")` is unreachable.** Only `/assets` calls
  `getPortfolioPageData`, always with `"assets"`; `/investments` uses
  `getInvestmentPageData`. The branch is dead code and a deletion-test candidate.
- **`/dashboard` reads the `settings` table twice** — once for
  `dashboard.preferences`, once for `financial_health.thresholds` — which is part of
  the 16-request dashboard fan-out recorded in
  [`docs/performance-baseline.md`](../performance-baseline.md). One `in (...)` read
  returns both.
- **Member option lists ignore `is_active`.** `/income` selects it; `/expenses`,
  `/investments`, `/monthly-plan`, `/goals`, and `/reports` select only
  `display_name`, so a paused Member can still be offered as a selectable option even
  though the database will refuse their writes. Whether paused Members should remain
  selectable for _historical attribution_ is a product decision to settle before the
  read models are split.
- **`financial_transactions` is read with two different filters** — `type='saving'`
  on `/goals`, `type='investment'` on `/investments`, both on `/dashboard`,
  `/reports`, and the export. A single shared "events" read model must keep the
  filter explicit at the call site, or `/goals` will start refreshing on Investment
  Events for no reason.
