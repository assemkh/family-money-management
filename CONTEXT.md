# Domain context

Canonical language for Family Money Management. Every term below has exactly one
meaning in code, database objects, copy, tests, and documentation. When product
language and storage names disagree, this file records both and names the winner.

Written during Phase 1.B of
[`docs/refactor_responsive_perofrmance_plan.md`](docs/refactor_responsive_perofrmance_plan.md).
It describes the system as it is today, not as a later phase intends it to be.

## Why this file exists

The audit found the same concept written three ways: a household is a `family` in
SQL, a `Household` in product copy, and a `familyId` in TypeScript. A saving event
and an investment event are one table with two enum values. `financial_transactions`
reads like a complete ledger but holds only two of its seven declared types. Each
mismatch costs a reader a lookup and lets a refactor silently change meaning.

A term belongs here when getting it wrong would change money, permissions, or
history. Ordinary UI nouns do not belong here.

## Naming rule

Product copy and new TypeScript use the **canonical term**. Existing database
columns keep their names; renaming `family_id` across a live RLS boundary buys
nothing and risks isolation. New database objects should use the canonical term.

## Core identity

### Household

One family unit that shares money. It is the privacy boundary: every financial row
belongs to exactly one Household, and Row Level Security scopes every read and write
to the caller's Household. Nothing in the product crosses this boundary.

- Stored as `public.families`; the foreign key is `family_id` everywhere.
- Owns `name`, `base_currency` (DZD), `timezone` (`Africa/Algiers`), `locale`
  (`en` or `ar`), and `date_format`.
- Resolved from the verified Auth user by `private.current_family_id()`. A
  client-supplied Household ID is never trusted as input.
- Canonical term: **Household**. Legacy storage term: `family`.

### Member

One person who can sign in and act inside a Household. A Member is a Supabase Auth
user joined to exactly one Household.

- Stored as `public.profiles`, keyed by the Auth user ID.
- `role` is `owner` or `member`. There is exactly one **Owner** per Household;
  the Owner is the only role that may manage settings, categories, income sources,
  member access, and passwords.
- `is_active` is **Member access**. An inactive Member is banned in Auth and
  refused by `private.require_active_finance_actor()` on every financial write.
- `must_change_password` forces password replacement before the workspace renders.
- `username` is the household-facing login name; login accepts username or email.
- Canonical terms: **Member**, **Owner**, **Member access**.

## Money and value

### Supported currency

Exactly three: `DZD`, `EUR`, `USD`. DZD is the base currency and the unit of every
comparison, total, and chart. There is no other currency, and no automatic rate feed.

### Manual Exchange Rate

A rate a Member enters by hand, converting one foreign currency to DZD on a date.

- Stored as `public.exchange_rates` (`currency`, `rate_to_base`, `effective_date`),
  unique per Household, currency, and date.
- The **effective rate** is the most recent row with `effective_date <= today`,
  resolved by `private.latest_rate_to_base()` in SQL and `latestRates()` in
  [`lib/finance/data.ts`](lib/finance/data.ts).
- Rates are never fetched from a network provider and never back-fill history.
- Canonical term: **Manual Exchange Rate**.

### Valuation

Converting an amount to DZD using the effective Manual Exchange Rate.

- A **complete** Valuation converted every row. An **incomplete** Valuation hit at
  least one non-zero foreign amount with no rate.
- An incomplete Valuation must surface as a missing-rate state, never as a total
  that silently omits the unconverted rows. `calculateDzdTotal()` in
  [`lib/finance/calculations.ts`](lib/finance/calculations.ts) returns
  `{ total, missingCurrencies, complete }` precisely so callers cannot lose this.
- Canonical term: **Valuation**. See
  [ADR 0001](docs/adr/0001-financial-source-of-truth.md).

### Account

A place money sits: cash, bank, postal (CCP), foreign currency, digital wallet, or
other.

- Stored as `public.accounts` with a single `currency` and a `current_balance`.
- `current_balance` is **derived state owned by the database**. It changes only
  through `record_expense`, `record_transfer`, and `set_account_balance`. Direct
  client writes to the balance are revoked.
- An Account holds exactly one currency. Cross-currency movement between Accounts
  is refused, not converted.
- Canonical term: **Account**.

## Cash flow

### Income Entry

Money a Member received in a given month, attributed to an Income Source.

- Stored as `public.income_entries`, keyed by `income_month` (first day of month),
  not by an exact date. Income is a monthly figure in this product.
- An Income Entry does **not** move an Account balance.

### Income Source

A named, Owner-managed origin of income, optionally owned by one Member
(`public.income_sources.owner_member_id`). Deactivating a Source hides it from new
entries and preserves its history.

### Expense Entry

Money spent, on a specific date, in one `main_category` and optionally one
subcategory.

- Stored as `public.expense_entries`.
- When a `payment_account_id` is present, the Expense Entry and the Account debit
  commit **atomically** through `record_expense`. Currencies must match; an
  insufficient balance refuses the whole operation.
- An Expense Entry without an Account is a record of spending that no tracked
  Account paid for.

### Expense Category

An Owner-managed, optionally two-level category. `type` is one of `essentials`,
`personal`, `savings`, `investment`, `reserve`, `liability`, `other` — the same
seven values the Monthly Plan allocates across. A child category must share its
parent's type.

### Transfer

Moving money between two Accounts of the same Household.

- Stored as `public.transfers`; the debit, the credit, and the Transfer row commit
  atomically through `record_transfer`.
- A Transfer is **never spending**. It must not appear in expense totals, saving
  rate, or plan variance.
- Cross-currency Transfers are refused; both Accounts must share a currency.

## Planning

### Monthly Plan

One Household's allocation intent for one calendar month.

- `public.monthly_plans` is the per-month pointer (`month_key`, `status`,
  `current_version_id`). One plan per Household per month.
- `status` is `draft`, `active`, or `closed`.

### Monthly Plan Revision

One immutable version of a Monthly Plan.

- Stored as `public.monthly_plan_versions` with `version_number`, a required
  `reason`, and five percentages: essentials, personal, savings, investment, reserve.
- The five percentages must total exactly `100.00`; the constraint is in the schema,
  not only in the form.
- Revisions are **append-only**. `private.prevent_plan_version_mutation()` raises on
  any update or delete. Changing a plan creates the next Revision and advances the
  pointer; it never edits history.
- Canonical term: **Monthly Plan Revision** (the plan's "version").

### Recurring Commitment

A repeating obligation — weekly, monthly, yearly, or a custom day interval — with a
`next_due_date`.

- Stored as `public.recurring_transactions`.
- It is a **reminder, not a ledger row**. Nothing posts automatically. A Recurring
  Commitment never changes an Account balance or a total on its own.

### Savings Goal

A named target amount, with a currency, priority, optional target date, and a status
of `active`, `paused`, `completed`, or `cancelled`.

- Stored as `public.savings_goals`. `current_amount` is derived state owned by the
  database and moves only through `record_saving_contribution`.

## Events and history

### Savings Event

One contribution toward one Savings Goal.

- Stored as a `public.financial_transactions` row with `type = 'saving'`,
  `source_table = 'savings_goals'`, and `source_id` set to the Goal.
- The event insert and the Goal's `current_amount` update commit atomically.
- Currencies must match the Goal; the Goal must be `active`.
- Canonical term: **Savings Event** (UI: "contribution").

### Investment Event

One recorded change in an Investment's value or position.

- Stored as a `public.financial_transactions` row with `type = 'investment'` and
  `source_id` set to the Investment; the Investment's `current_value` updates in the
  same transaction.

### Financial transaction ledger

`public.financial_transactions` is the shared event table behind Savings Events and
Investment Events.

- Its `transaction_type` enum declares seven values, but **only `saving` and
  `investment` are ever written today**. Income Entries, Expense Entries, and
  Transfers live in their own tables and are _not_ mirrored here.
- Treat it as the **event log for savings and investment activity**, not as a
  complete ledger. Any read that assumes it contains all money movement is wrong.

### Net Worth Snapshot

An immutable monthly photograph of Household position.

- Stored as `public.net_worth_snapshots`, one row per Household per month.
- Holds DZD totals for accounts, assets, investments, and liabilities, plus the
  `rates_snapshot` used at capture time.
- Only the current month may be captured; historical months are locked.
- A Snapshot is history. Later rate changes never rewrite an existing Snapshot.

### Asset, Investment, Liability

- **Asset** (`public.assets`): gold, investment-type, or other holdings with a
  purchase value and a current value.
- **Investment** (`public.investments`): a position with a `purchase_cost` and a
  `current_value`; **Gain** is `current_value - purchase_cost`.
- **Liability** (`public.liabilities`): a debt with `original_amount`, `paid_amount`,
  and status `active`, `paid`, or `closed`. **Remaining** is
  `max(original_amount - paid_amount, 0)`.

### Audit log

`public.audit_logs` is append-only row history written by database triggers, scoped
to a Household. It is never read by the application UI.

## Derived measures

These names appear in the dashboard, reports, and settings. Each has one definition.

| Term               | Definition                                                                      |
| ------------------ | ------------------------------------------------------------------------------- |
| **Monthly flow**   | Income for the month minus expenses for the month, in DZD                       |
| **Saving rate**    | Savings Events for the month as a percentage of income for the month            |
| **Plan variance**  | Actual spend against the active Monthly Plan Revision's allocation, as a ratio  |
| **Net worth**      | Accounts + Assets + Investments − Liabilities, valued in DZD                    |
| **Gain**           | `current_value − purchase_cost`, with return percentage when cost is above zero |
| **Remaining**      | `max(original_amount − paid_amount, 0)` for a Liability                         |
| **Planned amount** | `income × allocation_percent ÷ 100` for one Monthly Plan Revision category      |

Thresholds that turn these into `positive`, `neutral`, `warning`, or `negative`
badges are Household settings, defaulted in
[`lib/finance/calculations.ts`](lib/finance/calculations.ts) and overridable under
the `financial_health.thresholds` setting key.

## Settings keys

Household settings are rows in `public.settings`, keyed per Household:

- `allocation.defaults` — default Monthly Plan percentages;
- `dashboard.preferences` — which dashboard sections a Household shows;
- `financial_health.thresholds` — saving-rate and plan-variance classification.

Locale, timezone, base currency, and date format are columns on the Household row,
not settings rows.

## Roles and permissions

| Capability                                            | Owner | Member |
| ----------------------------------------------------- | :---: | :----: |
| Read all Household financial data                     |  yes  |  yes   |
| Record income, expenses, transfers, events, snapshots |  yes  |  yes   |
| Save a Monthly Plan Revision                          |  yes  |  yes   |
| Manage categories, income sources, settings           |  yes  |   no   |
| Add a Member, pause access, reset a password          |  yes  |   no   |

Inactive Members are refused at the database, not only in the UI.

## Words we do not use

- **Family** in new product copy or new TypeScript — say Household. `family_id`
  stays as a column name.
- **Transaction** on its own — say Expense Entry, Income Entry, Transfer, Savings
  Event, or Investment Event. Bare "transaction" hides which table and which rules.
- **Balance** for anything but `accounts.current_balance`.
- **Version** for a Monthly Plan — say Monthly Plan Revision.
- **Rate** without qualification — say Manual Exchange Rate or Saving rate.
- **Sync**, **live rate**, **auto-import** — nothing in this product fetches money
  data from an external service.

## Related decisions

- [ADR 0001 — Financial source of truth](docs/adr/0001-financial-source-of-truth.md)
- [ADR 0002 — Authenticated rendering and cache safety](docs/adr/0002-authenticated-rendering-and-cache-safety.md)
- [ADR 0003 — Adaptive navigation and breakpoints](docs/adr/0003-adaptive-navigation-and-breakpoints.md)
- [Mutation dependency map](docs/architecture/mutation-dependency-map.md)
