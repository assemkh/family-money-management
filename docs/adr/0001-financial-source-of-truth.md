# 0001 — Financial source of truth

**Status:** Accepted
**Date:** 2026-08-26
**Context:** Phase 1.B of [`docs/refactor_responsive_perofrmance_plan.md`](../refactor_responsive_perofrmance_plan.md)
**Terms:** [`CONTEXT.md`](../../CONTEXT.md)

## Context

The refactor moves 2,072 lines of query and transformation code out of
[`lib/finance/data.ts`](../../lib/finance/data.ts) into domain read models, and moves
34 Server Actions behind shared infrastructure. Both changes touch every path that
produces a number a household will act on.

The rules that keep those numbers correct are currently enforced in three different
places at once, and not always in the same place:

- **PostgreSQL** holds the invariants that must never be bypassed: `record_expense`
  debits an Account and inserts an Expense Entry in one transaction and refuses a
  currency mismatch or an overdraft; `record_transfer` refuses a cross-currency
  move; `save_monthly_plan` requires the five allocations to total exactly `100.00`
  and appends a Monthly Plan Revision rather than editing one;
  `private.prevent_plan_version_mutation()` raises on any Revision update or delete;
  `capture_net_worth_snapshot` refuses any month but the current one;
  `private.require_active_finance_actor()` refuses an inactive Member. Direct client
  writes that could bypass these are revoked.
- **TypeScript** holds presentation-time derivation:
  [`lib/finance/calculations.ts`](../../lib/finance/calculations.ts) converts to DZD,
  totals, computes gain, remaining, planned amount, monthly flow, percentage
  breakdowns, and classifies health status against household thresholds.
- **Zod schemas** in `lib/finance/validation.ts` and `lib/settings/validation.ts`
  shape input before it reaches either.

Without a written rule, a read-model extraction is free to re-derive a balance in
TypeScript "for speed", and an action refactor is free to validate a plan total in
Zod and skip the RPC. Both would look like they work.

Two further facts drove this record. `accounts.current_balance` and
`savings_goals.current_amount` are **stored derived state** — cheap to read, but only
correct because a small set of atomic functions owns every write to them. And
`calculateDzdTotal()` returns `{ total, missingCurrencies, complete }` rather than a
bare number, because a Valuation that silently drops an unconvertible foreign amount
produces a plausible, wrong total.

## Decision

**1. PostgreSQL owns every financial invariant.**
An invariant is any rule whose violation would corrupt money, history, or isolation:
atomicity of a debit with its record, currency matching, sufficient balance, exact
100% allocation, Revision immutability, current-month-only snapshots, active-Member
enforcement, and Household isolation. These live in migrations, are covered by pgTAP
tests, and are never relocated into TypeScript. TypeScript may pre-check any of them
for a better error message; it may never be the only check.

**2. Stored derived state has exactly one writer.**
`accounts.current_balance` and `savings_goals.current_amount` change only through
`record_expense`, `record_transfer`, `set_account_balance`, and
`record_saving_contribution`. Read models read these columns; they never recompute a
balance from history and present it as the balance. A future change that recomputes
balances must replace the writer, not add a second one.

**3. Append-only history is never rewritten.**
Monthly Plan Revisions and Net Worth Snapshots are immutable. A correction creates
the next Revision with a reason, or is refused. A Snapshot keeps the
`rates_snapshot` it captured; a later Manual Exchange Rate change never restates a
past Snapshot.

**4. Presentation-time derivation is TypeScript's, and lives in one module.**
Valuation, totals, gain, remaining, planned amount, monthly flow, breakdowns, and
health classification stay in `lib/finance/calculations.ts` — pure, synchronous, and
unit-tested with no database access. Read models fetch rows and call these functions;
they do not grow private copies of the same arithmetic. When Phase 2 extracts domain
read models, the shared valuation implementation is imported by all of them and owned
by none.

**5. Valuation reports incompleteness; it never hides it.**
Any total spanning more than one currency returns completeness alongside the number.
A surface showing an incomplete total must show the missing-rate state. Substituting
a stale rate, a rate of 1, or a silent omission is forbidden.

**6. Transfers are not spending.**
A Transfer moves money between Accounts of one Household. It must not enter expense
totals, saving rate, plan variance, or any spending chart.

**7. `financial_transactions` is the savings and investment event log, not a ledger.**
Only `saving` and `investment` rows are written. No read model may treat it as
containing all money movement. If a later phase mirrors income, expenses, or
transfers into it, that is a schema decision requiring a new ADR, a migration, and
allow/deny tests — not a query change.

**8. Household scope comes from the verified session.**
Every read and write derives the Household from `private.current_family_id()` or the
verified profile. A Household ID from a form, query string, or client prop is input
to validate, never an authorization decision.

## Consequences

- A financial invariant costs a migration plus allow-and-deny pgTAP tests. That is
  the intended price; it is what makes the rule hold when a future page forgets it.
- Some validation is expressed twice: once in Zod for the field error, once in SQL
  for the guarantee. This duplication is accepted and deliberate. The SQL copy is
  authoritative; the Zod copy may be relaxed but never made stricter in a way that
  hides a database refusal.
- Read models stay comparatively thin: fetch rows, call shared calculations, shape a
  view model. That keeps the Phase 2 extraction mechanical and testable.
- Snapshot-based history means a corrected rate does not retroactively improve past
  months. This is the intended behavior for a household's own records.

## Rejected alternatives

**Move invariants into the application for speed.** Fewer round trips, but every
invariant would then depend on a code path being taken. RLS and atomicity would
become conventions. Rejected outright.

**Recompute balances from history on read.** Self-healing and auditable, but it turns
every Account read into a scan, and it makes the same number derivable two ways —
which is how two answers appear. Rejected; revisit only with a measured plan and a
migration that removes the stored column.

**Mirror everything into `financial_transactions` now.** A genuinely complete ledger
would simplify reports. It is also a schema migration with backfill, new RLS, and new
tests, and it is not what this refactor is for. Deferred to its own ADR.

**Let each read model own its own conversion helper.** Better locality per module,
but Valuation is the one calculation whose inconsistency would be least visible and
most damaging. Kept shared.

## Verification

A reviewer can confirm this record still holds by checking that:

- every new financial rule arrives as a migration with allow-and-deny pgTAP coverage
  in `supabase/tests/`;
- no read model writes `current_balance` or `current_amount`, and no read model
  recomputes them;
- no module outside `lib/finance/calculations.ts` defines a DZD conversion;
- every multi-currency total surfaces its completeness;
- `financial_transactions` reads still filter to `saving` and `investment`;
- financial totals match snapshot fixtures before and after any read-model change.
