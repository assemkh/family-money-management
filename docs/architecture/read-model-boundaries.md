# Domain read-model boundaries

**Replaces:** `lib/finance/data.ts` (2,074 lines)
**Status:** Extracted in Phase 2.B on 2026-08-26
**Terms:** [`CONTEXT.md`](../../CONTEXT.md)
**Governed by:** [ADR 0001](../adr/0001-financial-source-of-truth.md)

Where each read model lives after the split, what owns shared valuation, and which
proposed modules were dropped for failing the deletion test.

## What the current module actually contains

| Region                          |    Lines | Contents                                    |
| ------------------------------- | -------: | ------------------------------------------- |
| Types                           |    1–278 | 28 exported types                           |
| Shared helpers                  |  279–300 | `addTotals`, `ensureNoQueryErrors`          |
| Read models and private helpers | 301–2074 | 14 exported page loaders, 8 private helpers |

The 14 read models, by size:

| Read model                    | Lines | Domain               |
| ----------------------------- | ----: | -------------------- |
| `getDashboardPageData`        |   426 | composed             |
| `getReportsPageData`          |   239 | composed             |
| `getMonthlyPlanPageData`      |   142 | planning             |
| `getNetWorthPageData`         |   135 | net worth (composed) |
| `getExpensePageData`          |    94 | cash flow            |
| `getIncomePageData`           |    84 | cash flow            |
| `getReportActivityExportData` |    80 | composed             |
| `getSavingsGoalsPageData`     |    76 | planning             |
| `getInvestmentPageData`       |    72 | net worth            |
| `getAccountsPageData`         |    66 | net worth            |
| `getTransfersPageData`        |    53 | cash flow            |
| `getRecurringPageData`        |    53 | planning             |
| `getPortfolioPageData`        |    40 | net worth            |
| `getLiabilitiesPageData`      |    25 | net worth            |

**Only 11 of the 28 exported types are imported anywhere else.** `MoneyTotal`,
`IncomeSourceOption`, `ExpenseCategoryOption`, `AccountOption`, `ManualExchangeRate`,
`MonthlyPlanAllocation`, `SavingsGoal`, `DashboardTrendPoint`,
`DashboardBreakdownItem`, `DashboardPlanRow`, and `DashboardHealthIndicator` reach a
page or a form. The other 17 are structural detail of return types that no consumer
names. That is the concrete shape of "broad but not deep": a 278-line public type
surface where 11 types would do.

## Target layout

```
lib/finance/
  calculations.ts                 unchanged — pure arithmetic, no I/O
  validation.ts                   unchanged
  csv.ts                          unchanged
  valuation/
    rates.ts                      the only reader of exchange_rates
  read-models/
    registry.ts                   ReadModelKey -> routes, for invalidation
    cash-flow/
      income.ts                   readIncomePage()
      expenses.ts                 readExpensePage()
      transfers.ts                readTransfersPage()
    planning/
      monthly-plan.ts             readMonthlyPlanPage(month?)
      recurring.ts                readRecurringPage()
      goals.ts                    readGoalsPage()
    net-worth/
      accounts.ts                 readAccountsPage(), readAccountOptions()
      portfolio.ts                readAssetsPage(), readInvestmentsPage()
      liabilities.ts              readLiabilitiesPage()
      snapshots.ts                readSnapshots(months)
      page.ts                     readNetWorthPage()
    dashboard/
      summary.ts                  readDashboardSummary(month?)
      analysis.ts                 readDashboardAnalysis(month?)
    reports/
      summary.ts                  readReportSummary(month?, year?)
      activity.ts                 readReportActivity(filters)
```

`lib/settings/data.ts` keeps `getSettingsPageData`; settings is already its own
domain and moving it would be motion without depth.

Each module owns the types it returns. A type is exported only when a page or
component names it — the other 17 become internal.

## Dependency direction

```
pages / route handlers
        ↓
composed read models  (dashboard, reports, net-worth/page)
        ↓
domain read models    (cash-flow, planning, net-worth/*)
        ↓
valuation/rates.ts
        ↓
calculations.ts  ·  household-context.ts
```

Downward only. A domain module never imports a composed one; two domain modules never
import each other except through the one declared exception below.

**The one exception:** `readAccountOptions()` lives in `net-worth/accounts.ts` and is
imported by `cash-flow/expenses.ts` and `cash-flow/transfers.ts`, which need Account
options for their payment and transfer selects. Accounts belong to net worth because
that is where their balances are valued; duplicating the reader in cash flow would
create two definitions of an Account option. The import is declared here so it stays a
known edge rather than the start of a mesh.

## Read-model contract

Every page-facing read model:

1. **Takes only view parameters** — a selected month, a report filter. It never takes
   a Household ID; scope comes from `requireHouseholdContext()` (ADR 0001, decision 8).
2. **Returns a complete view model.** A page renders from one call and does no
   Supabase work of its own.
3. **Returns no Supabase rows.** Postgres numerics arrive as strings; converting them
   is the read model's job, not the page's.
4. **Redirects rather than returning `null`.** `requireHouseholdContext()` handles the
   dead-session case, which removes the `if (!data) redirect("/login")` currently
   repeated in every page. The `/reports/export` handler is the exception — it needs a
   401, so `readReportActivity` keeps a nullable variant.
5. **Calls shared calculations; never re-derives them.** No module outside
   `calculations.ts` defines a conversion, a gain, or a health classification.
6. **Fetches only the columns, rows, months, and plan versions it renders.** Broad
   selects are removed as each module is extracted, not in a separate sweep.

## Splitting the composed read models

`getDashboardPageData` returns roughly 25 fields from 13 tables in one 426-line
function, and a page cannot reveal any part of it before all of it resolves. It splits
along what a household reads first:

| `readDashboardSummary` (critical)            | `readDashboardAnalysis` (secondary) |
| -------------------------------------------- | ----------------------------------- |
| selected/current/previous/next month         | plan rows and plan variance         |
| dashboard preferences                        | expense breakdown, asset allocation |
| income, spending, savings, investment totals | trend series                        |
| remaining flow, saving rate                  | health indicators                   |
| net worth and its source                     | savings goals                       |
| missing-rate currencies                      | historical snapshots                |

`getReportsPageData` splits the same way: the period summary and the plan-variance
table separate from the filtered activity list, which is what the export already
consumes through `getReportActivityExportData`.

This split is what makes the Phase 4.A Suspense boundaries possible. It is specified
here so Phase 2.B extracts along that line the first time rather than splitting twice.

## Valuation ownership

Two modules, one rule each.

**`lib/finance/calculations.ts` — pure, shared, owned by no domain.**
Unchanged by this refactor. Owns `convertToDzd`, `calculateDzdTotal`, `calculateGain`,
`calculateLiabilityRemaining`, `calculatePlannedAmount`, `calculateMonthlyFlow`,
`calculatePercentageBreakdown`, `calculateAveragePlanVariance`, `classifySavingRate`,
and `classifyPlanVariance`. No I/O, no Supabase import, no `async`. Unit-tested
directly.

**`lib/finance/valuation/rates.ts` — the only reader of `exchange_rates`.**
Takes over `latestRates()`, currently private at `lib/finance/data.ts:479`, and
returns both the `ExchangeRateMap` the calculations need and the per-currency
effective-date detail the accounts and settings surfaces display.

```ts
export type EffectiveRate = {
  readonly currency: "EUR" | "USD";
  readonly rate: number | null;
  readonly effectiveDate: string | null;
};

export type EffectiveRates = {
  readonly rates: ExchangeRateMap;
  readonly detail: ReadonlyMap<"EUR" | "USD", EffectiveRate>;
};

export function readEffectiveRates(context: HouseholdContext): Promise<EffectiveRates>;
```

Six read models query `exchange_rates` today. After the split, they call
`readEffectiveRates()` and none of them writes that query again.

### Ownership rules for shared calculation code

1. **A calculation belongs in `calculations.ts` only when two or more domains need
   it.** A single-domain derivation stays in its domain module. This is what stops
   `calculations.ts` becoming the next shallow monolith.
2. **Shared code is owned by no domain.** A change to `convertToDzd` is a change to
   every total in the product and is reviewed as such. A domain module may not fork it
   "just for this page".
3. **Completeness crosses every boundary.** A multi-currency total leaves a read model
   as `{ total, missingCurrencies, complete }`, never as a bare number (ADR 0001,
   decision 5). A view model that flattens it has thrown the missing-rate state away.
4. **Rates are read once per request.** `readEffectiveRates()` is memoized on the
   request context, so the composed dashboard and net-worth models share one read
   instead of the several they issue today.

## What is not proposed

Applying the deletion test to the obvious candidates:

- **`lib/finance/read-models/index.ts` barrel.** Pure pass-through. Callers import the
  module that owns the model.
- **A `types.ts` per domain.** Types live beside the function returning them, which is
  what gives the split its Locality. A separate file would recreate the 278-line type
  region one directory down.
- **A `valuation/money.ts` wrapper over `calculations.ts`.** `calculations.ts` is
  already the module; wrapping it hides nothing.
- **A repository or query-builder layer under the read models.** The Supabase client
  is already the query Interface. A second one would be a layer with no secret.
- **A `readHouseholdRow()` generic helper.** Every read model's query differs in
  columns, filters, and ordering; the generic version would take all of them as
  parameters and be longer than the call it replaced.
- **Keeping `getPortfolioPageData(kind)`.** Its `"investments"` branch is unreachable —
  only `/assets` calls it, always with `"assets"`. It becomes `readAssetsPage()`, and
  the dead branch is deleted rather than carried forward.

## Extraction order

Smallest and least entangled first, so the pattern is proven before the two large
composed models move:

1. `valuation/rates.ts` — six callers depend on it; nothing depends on them yet.
2. `net-worth/liabilities.ts`, `net-worth/portfolio.ts`, `net-worth/accounts.ts`.
3. `cash-flow/*` and `planning/*`.
4. `net-worth/page.ts` — first composed model, built from step 2.
5. `dashboard/*` and `reports/*` — split as specified above.
6. `registry.ts`, once every read model exists to be named.

`lib/finance/data.ts` shrinks to compatibility re-exports during the move and is
**deleted** when the last consumer moves. Per the plan's risk controls, a refactor
that only adds layers without removing the obsolete structure is incomplete.

## Implementation notes

_Phase 2.B, 2026-08-26._ `lib/finance/data.ts` is deleted. Every financial total is
unchanged, proved by 15 committed snapshots taken before the move and re-verified
after each step.

### Final layout

| Module                        | Lines | Tables                                                          |
| ----------------------------- | ----: | --------------------------------------------------------------- |
| `valuation/rates.ts`          |    63 | `exchange_rates` — the only reader                              |
| `valuation/totals.ts`         |    28 | none, pure                                                      |
| `read-models/query-errors.ts` |    13 | none, pure                                                      |
| `cash-flow/income.ts`         |   105 | `income_entries`, `income_sources`, `profiles`                  |
| `cash-flow/expenses.ts`       |   114 | `expense_entries`, `expense_categories`, `accounts`, `profiles` |
| `cash-flow/transfers.ts`      |    67 | `transfers`, `accounts`                                         |
| `net-worth/accounts.ts`       |    78 | `accounts`                                                      |
| `net-worth/portfolio.ts`      |   127 | `assets`, `investments`, `financial_transactions`, `profiles`   |
| `net-worth/liabilities.ts`    |    39 | `liabilities`                                                   |
| `net-worth/page.ts`           |   148 | 5 net-worth tables                                              |
| `planning/monthly-plan.ts`    |   178 | plans, revisions, income, settings, profiles                    |
| `planning/recurring.ts`       |    70 | `recurring_transactions`, `expense_categories`                  |
| `planning/goals.ts`           |   131 | `savings_goals`, `financial_transactions`, `profiles`           |
| `dashboard/page.ts`           |   474 | 11 tables, composed                                             |
| `reports/page.ts`             |   489 | 6 tables, composed                                              |

The domain modules are 39–178 lines and single-domain. The two composed models are
larger and span domains by design — that is what "composed" means, and it is a
different thing from the original file's fourteen unrelated page loaders. Their size
falls further in Phase 4.A, where the streaming split gives a reason to separate them.

### Deviations from the specification above

**`net-worth/snapshots.ts` was not created.** Snapshots are read only by
`net-worth/page.ts`, `dashboard/page.ts`, and `reports/page.ts`, each with a different
projection and row limit. A shared reader would have taken all three as parameters and
been longer than the queries it replaced, so it fails the deletion test.

**`read-models/registry.ts` was not created.** It exists to resolve read-model keys to
routes for declarative invalidation, which lands in Phase 4.A. Creating it now would
add a module with no consumer.

**Dashboard and Reports were not split into summary and analysis.** The specification
called for this, and it was deliberately deferred. The two halves are not
query-disjoint as the function stands: the "critical" totals and the "secondary"
trends read the same income, expense, and event rows, and both derive from one shared
rate map. Splitting today would either duplicate four queries or leave the second half
waiting on the first, which is worse than the single call it replaced. The plan
qualifies this work with "where that enables useful streaming"; the split belongs with
the Suspense boundaries in Phase 4.A, which is where the query-disjoint version can be
designed and measured together.

**`getPortfolioPageData(kind)` became `readAssetsPage()`.** Its `"investments"` branch
was unreachable — `/investments` has its own read model — so the branch, the `kind`
parameter, and the misleading `PortfolioPage` component name are all gone; the
component is now `AssetsPage`.

### Query changes and their evidence

Two unbounded reads and one duplicate read were removed. All three were verified with
`EXPLAIN (ANALYZE, BUFFERS)` against a scaled fixture — 6,000 expense entries across
24 months and 242 Monthly Plan Revisions.

**The unbounded revision read.** Dashboard and Reports each fetched every
`monthly_plan_versions` row for the Household and then found one in memory. At scale:

```
Seq Scan on monthly_plan_versions (actual rows=242) — Buffers: shared hit=7
```

Both now embed the current Revision through the existing composite foreign key,
`monthly_plan_versions!monthly_plans_current_version_fk`:

```
Nested Loop Left Join (actual rows=1) — Buffers: shared hit=4
  -> Index Scan using monthly_plan_versions_id_plan_key (actual rows=1)
```

Bounded regardless of how many revisions a Household accumulates, and it uses an index
that already existed for the unique constraint.

**The duplicate settings read.** The dashboard read `settings` twice — once for
`dashboard.preferences` and once for `financial_health.thresholds`. The first read
must stay sequential because `trendRange` and `defaultMonth` decide the fan-out's date
ranges, so it now carries both keys with `.in(...)`.

**No new indexes are proposed.** The measured plans do not justify any. The date-range
reads on `expense_entries` already use `expense_entries_family_month_idx` via a bitmap
index scan at 6,000 rows. The `settings` read is a sequential scan of three rows in
one buffer, which is what PostgreSQL should choose at that cardinality; an index there
would be speculative and would cost write performance.

### Measured result

| Route           | Phase 1 baseline | After 2.A | After 2.B |
| --------------- | ---------------: | --------: | --------: |
| `/dashboard`    |               16 |        15 |    **13** |
| `/reports`      |               10 |         9 |     **8** |
| `/net-worth`    |                8 |         7 |         7 |
| `/settings`     |                8 |         7 |         7 |
| `/expenses`     |                7 |         6 |         6 |
| `/monthly-plan` |                7 |         6 |         6 |

Dashboard is down 19% and Reports 20% from the Phase 1 baseline.

### No new database objects

Phase 2.B added no view, function, or index, so there is nothing new to grant or
expose through the Data API. The embed is a PostgREST query shape over an existing
foreign key, and RLS still applies to the embedded resource. Because the shape is new,
`supabase/tests/011_plan_revision_embed_isolation.test.sql` asserts the join it
compiles to stays Household-scoped for owner, member, non-member, and anonymous
callers — 8 tests, taking the suite from 131 to 139.

## Acceptance evidence for Phase 2.B

- [x] No domain module mixes domains; the two composed models span domains by design.
- [x] `lib/finance/data.ts` no longer exists.
- [x] Exactly one module reads `exchange_rates`; exactly one defines DZD conversion.
- [x] Financial totals match snapshot fixtures before and after — 15 snapshots in
      `tests/characterization/`, re-verified after every step.
- [x] Dashboard Supabase request count fell from 16 to 13.
