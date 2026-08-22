# Family Finance Management Web App — Starting Plan

> **Document:** `starting_plan.md`
> **Purpose:** Complete implementation blueprint for AI coding agents and human developers
> **Project type:** Private family finance management web application
> **Frontend:** Next.js (App Router) + TypeScript
> **Hosting:** Vercel
> **Backend/DB/Auth:** Supabase PostgreSQL + Supabase Auth + RLS
> **Primary users:** Assem + Wife
> **Primary currency:** DZD
> **Supported currencies:** DZD, EUR, USD
> **Design goal:** Modern, premium, calm, extremely simple, mobile-first, wife-friendly, data-rich without feeling complicated

---

# 0. Executive Goal

Build a private, production-quality family finance management application that replaces the previously designed Excel workbook and turns it into a secure, synchronized web application accessible from anywhere.

The application must treat all finances as **shared family finances**, while still recording which person created an income/expense entry for transparency and analysis.

The system must be:

- Simple enough for a non-technical spouse to use daily.
- Powerful enough to provide professional financial analysis.
- Fully responsive on desktop, tablet, and mobile.
- Accessible from anywhere through a secure login.
- Designed for exactly two household users initially, but architected so more users/families can be added later.
- Database-first and auditable.
- Secure by default.
- Easy to maintain by AI coding agents.
- Free/low-cost at small scale.
- Ready for production deployment on Vercel + Supabase.

The application is **not an accounting product** and must not pretend to provide legal, tax, investment, or financial advice. It is a private personal/family finance tracker.

---

# 1. Non-Negotiable Product Rules

## 1.1 Shared money model

There is one family financial pool.

Do NOT create separate financial ownership for:

- Assem's money
- Wife's money

Instead:

- `family_id` identifies the shared household.
- `member_id` records who entered/created the transaction.
- Reports may compare Assem vs Wife for transparency.
- Balances and net worth belong to the family.

## 1.2 Monthly-first financial model

The application is primarily monthly.

A month is the main planning unit:

1. Record actual income for Assem.
2. Record actual income for Wife.
3. Calculate total family income.
4. Set allocation percentages for the month.
5. Calculate planned amounts automatically.
6. Track actual expenses and savings/investments.
7. Compare Plan vs Actual.
8. Roll results into monthly and annual reports.
9. Track the effect on net worth.

Daily entries are supported, but daily bookkeeping must stay lightweight.

## 1.3 Flexible monthly allocation

The user chooses the allocation percentages each month.

Default categories:

- Essentials & Obligations
- Personal
- Savings
- Investments
- Reserve

The dashboard presents **Savings + Investments** as a combined high-level section, while detailed reporting separates them.

The percentages may change during the month.

Every change must be preserved historically.

Required model:

`Original Plan -> Revised Plan(s) -> Actual`

Never destroy the previous version.

## 1.4 Do not confuse transfers with expenses

Moving money between:

- Cash
- CCP
- EUR
- USD
- Gold
- Investments

is NOT automatically an expense.

Transfers must be a separate transaction type.

Purchasing an asset is also not an ordinary consumption expense; the system must model it separately where applicable.

## 1.5 Manual exchange rates

Do not fetch foreign exchange rates automatically.

The user manually edits:

- EUR -> DZD
- USD -> DZD

from Settings.

All DZD valuations must update from the current manual rate.

## 1.6 Gold valuation

Gold is intentionally simple.

Store:

- Purchase value
- Current value

Do not require:

- grams
- gram price
- purity
- live gold market API

Unless a future version explicitly adds these features.

## 1.7 No hardcoded business rules in UI

Categories, currencies, allocation rules, financial-health thresholds, recurring periods, and other configurable values must come from database-backed settings or controlled configuration.

UI must not require a code deployment to rename/add a category.

---

# 2. Technology Stack

## 2.1 Frontend

Use:

- Next.js App Router
- TypeScript strict mode
- React
- Tailwind CSS
- shadcn/ui or an equivalent accessible component system
- Lucide icons
- Recharts (or equivalent maintained chart library)
- React Hook Form
- Zod
- TanStack Query where client-side cached fetching is beneficial
- date-fns (or equivalent)
- ESLint
- Prettier

Prefer Server Components by default.

Use Client Components only when interactivity requires them.

## 2.2 Backend

Use Supabase:

- PostgreSQL
- Supabase Auth
- Row Level Security
- Database functions/triggers only where they materially improve correctness
- Storage only if a later feature requires receipts/documents
- Database migrations tracked in Git

Do not create an unnecessary standalone Node/Express backend.

## 2.3 Hosting

Use Vercel for the Next.js application.

Use:

- GitHub as source control
- Vercel preview deployments for branches/PRs
- Vercel production deployment from the production branch
- Environment variables stored in Vercel, never committed

## 2.4 Current Supabase/Next.js security pattern

Use the current Supabase SSR approach for Next.js:

- `@supabase/ssr`
- browser client for browser-side code
- server client for Server Components, Server Actions, and Route Handlers
- cookie-based sessions
- proper token refresh/proxy handling
- current Supabase Auth recommendations

Do not implement an old localStorage-only authentication flow.

---

# 3. Authentication Requirements

## 3.1 Initial account

Seed a first household owner account with:

- Username: `assemkh`
- Initial password: configured through the `BOOTSTRAP_ADMIN_PASSWORD` secret

This credential is a bootstrap credential only.

### Mandatory security behavior

- NEVER hardcode the password in source code.
- NEVER commit it to Git.
- Store the bootstrap password as a local/CI/deployment secret.
- Create the account using a migration/seed script or controlled admin setup.
- Force the user to change the password immediately after the first successful login.
- Prevent access to the main application until the initial password has been changed.
- The initial password must not remain usable as a permanent production credential.

The login UI should present:

- Username
- Password
- Remember session
- Forgot password
- Change password

The user must not need to know the underlying Supabase Auth email.

## 3.2 Username implementation

Supabase Auth is email/phone oriented, so do NOT try to replace the Auth identity model with a plain database password.

Implement:

- Supabase Auth identity internally.
- `profiles.username` for `assemkh`.
- A secure server-side login flow that resolves username -> internal Auth identity/email and then performs Supabase Auth sign-in.
- The internal Auth email must be stored/configured securely and must never be shown as the user's login identifier.

Do not store plaintext passwords in PostgreSQL application tables.

## 3.3 Future second user

Create a future-ready Wife account:

- separate Supabase Auth user
- separate profile row
- same `family_id`
- same family financial visibility
- member attribution preserved

The UI should allow adding the second household member later.

## 3.4 Password management

Implement:

- Change password
- Forgot password
- Password reset
- Password strength validation
- Password confirmation
- Logout from current device
- Logout all sessions if supported by the selected Auth APIs
- Session expiration handling

## 3.5 Access control

Initial roles:

- `owner`
- `member`

Owner:

- all family financial data
- manage settings
- manage categories
- manage family members
- manage security settings

Member:

- full family finance access by default
- cannot remove the owner
- cannot perform destructive household administration unless granted

Make authorization rules explicit in DB/RLS, not only in React.

---

# 4. Data Model

Use UUID primary keys where practical.

Every family-owned table must have `family_id`.

Add:

- `created_at`
- `updated_at`
- `created_by`
- `updated_by`

where relevant.

Use UTC timestamps in PostgreSQL and render in the user's configured timezone.

Recommended tables:

## 4.1 `families`

Fields:

- id
- name
- base_currency
- timezone
- locale
- date_format
- created_at
- updated_at

Default:

- base_currency = `DZD`
- timezone = `Africa/Algiers`

## 4.2 `profiles`

Fields:

- id (references auth.users)
- display_name
- username
- avatar_url nullable
- role
- family_id
- must_change_password
- last_login_at
- created_at
- updated_at

Unique:

- username
- `(family_id, username)`

## 4.3 `income_sources`

Fields:

- id
- family_id
- owner_member_id
- name
- is_active
- sort_order
- created_at
- updated_at

Seed four sources:

- Assem Source 1
- Assem Source 2
- Wife Source 1
- Wife Source 2

## 4.4 `income_entries`

Fields:

- id
- family_id
- member_id
- source_id
- income_month
- amount
- currency
- note
- created_at
- updated_at

Validation:

- amount > 0
- currency is supported
- month is normalized to first day of month

## 4.5 `expense_categories`

Fields:

- id
- family_id nullable for system defaults
- parent_category
- name
- type
- is_active
- sort_order
- created_at
- updated_at

Types:

- `essentials`
- `personal`
- `savings`
- `investment`
- `reserve`
- `liability`
- other configurable types as needed

## 4.6 `expense_entries`

Fields:

- id
- family_id
- member_id
- transaction_date
- month_key
- main_category
- subcategory_id
- amount
- currency
- payment_account_id nullable
- note
- created_at
- updated_at

Daily workflow should remain fast.

## 4.7 `accounts`

Used for liquid/financial accounts:

- Cash
- CCP
- EUR
- USD
- other future accounts

Fields:

- id
- family_id
- name
- type
- currency
- current_balance
- is_active
- sort_order
- created_at
- updated_at

## 4.8 `assets`

Fields:

- id
- family_id
- asset_type
- name
- purchase_value
- current_value
- currency
- purchase_date nullable
- notes
- is_active
- created_at
- updated_at

Asset types:

- gold
- investment
- other

## 4.9 `investments`

Fields:

- id
- family_id
- name
- type
- purchase_cost
- current_value
- currency
- purchase_date
- notes
- created_at
- updated_at

Calculated:

- unrealized_gain
- return_percentage

## 4.10 `savings_goals`

Fields:

- id
- family_id
- name
- target_amount
- current_amount
- currency
- target_date nullable
- priority
- status
- notes
- created_at
- updated_at

Seed examples:

- Emergency Fund
- Wedding
- Car
- Travel
- Home
- Other Goal

## 4.11 `monthly_plans`

One logical current plan per family/month.

Fields:

- id
- family_id
- month_key
- status
- current_version_id
- created_at
- updated_at

Statuses:

- draft
- active
- closed

## 4.12 `monthly_plan_versions`

Every plan revision is immutable.

Fields:

- id
- monthly_plan_id
- version_number
- reason
- essentials_percent
- personal_percent
- savings_percent
- investment_percent
- reserve_percent
- created_by
- created_at

Validation:

- percentages >= 0
- total = exactly 100%

Calculated planned amounts must use actual family income for the selected month.

## 4.13 `financial_transactions`

Optional normalized ledger table if the implementation chooses a unified ledger.

Types:

- income
- expense
- saving
- investment
- transfer
- adjustment
- debt_payment

If separate domain tables are used instead, maintain a clear reporting layer that produces the same normalized analytical output.

Do not duplicate monetary events in multiple places without a clear source-of-truth rule.

## 4.14 `transfers`

Fields:

- id
- family_id
- transfer_date
- from_account_id
- to_account_id
- amount
- currency
- note
- created_by
- created_at

Never count transfer amounts as consumption expenses.

## 4.15 `recurring_transactions`

Fields:

- id
- family_id
- name
- type
- category_id nullable
- amount
- currency
- frequency
- next_due_date
- active
- notes
- created_at
- updated_at

Initial frequencies:

- monthly
- weekly
- yearly
- custom

## 4.16 `liabilities`

Fields:

- id
- family_id
- name
- type
- original_amount
- paid_amount
- currency
- due_date nullable
- monthly_payment nullable
- status
- notes
- created_at
- updated_at

Calculated:

- remaining_amount

## 4.17 `exchange_rates`

Fields:

- id
- family_id
- currency
- rate_to_base
- effective_date
- created_at
- updated_at

At minimum:

- EUR -> DZD
- USD -> DZD

No automatic rate provider.

## 4.18 `settings`

Use either a structured settings table or dedicated configuration tables.

Configurable:

- currency list
- categories
- financial health thresholds
- default allocation percentages
- family name
- UI language
- date format
- dashboard preferences
- default month

## 4.19 `audit_logs`

Recommended.

Fields:

- id
- family_id
- actor_user_id
- action
- entity_type
- entity_id
- old_values JSONB nullable
- new_values JSONB nullable
- created_at

Log high-value changes:

- monthly-plan changes
- settings changes
- account balance edits
- asset valuation edits
- liabilities changes
- member/role changes
- password/security events where appropriate
- destructive deletes

Never log plaintext passwords.

---

# 5. Financial Calculation Rules

## 5.1 Family income

`Family Income = Assem Income + Wife Income + Other Active Family Income`

For selected month.

## 5.2 Planned amount

For each monthly plan category:

`Planned Amount = Family Income × Current Plan Percentage`

## 5.3 Actual essentials spending

Sum expense entries for the selected month where the main category is `essentials`.

## 5.4 Actual personal spending

Sum expense entries for the selected month where the main category is `personal`.

## 5.5 Actual savings

Actual saved amount must come from explicit saving records/ledger events, not from a planned percentage.

Do not infer actual savings simply because the plan says 20%.

## 5.6 Actual investment

Actual investment amount must come from explicit investment records/ledger events.

## 5.7 Saving & Investment display

Dashboard:

`Saving & Investment = Actual Savings + Actual Investments`

Detailed pages separate:

- Savings
- Investments

## 5.8 Remaining

Define remaining clearly.

Preferred:

`Remaining Operational Cash = Family Income - Actual Consumptive Expenses - Actual Savings - Actual Investments`

Do not subtract internal transfers.

## 5.9 Variance

For expenses:

`Variance = Actual - Planned`

For savings/investments, show both:

- Amount variance
- Percentage variance

Color rules should be semantic:

- overspending on expense categories = warning/danger
- underspending on expenses = positive
- meeting/exceeding savings target = positive
- falling below savings target = warning

## 5.10 Net worth

`Net Worth = Total Assets - Total Liabilities`

Assets include:

- cash
- CCP
- foreign currency converted to DZD
- gold current value
- investments current value
- other configured assets

Liabilities include:

- outstanding debts
- outstanding obligations

## 5.11 Foreign currency valuation

For EUR:

`EUR DZD Value = EUR Amount × Current EUR/DZD Rate`

For USD:

`USD DZD Value = USD Amount × Current USD/DZD Rate`

Never hardcode rates.

## 5.12 Gold gain/loss

`Gold Gain = Current Value - Purchase Value`

`Gold Return % = Gain / Purchase Value`

Protect against division by zero.

---

# 6. Product Navigation

Primary navigation:

1. Dashboard
2. Monthly Plan
3. Expenses
4. Income
5. Accounts & Assets
6. Goals
7. Investments
8. Liabilities
9. Transfers
10. Recurring
11. Net Worth
12. Reports
13. Settings

Mobile navigation:

- Bottom navigation for the most important pages
- Menu drawer/sheet for secondary pages

Recommended mobile primary items:

- Home
- Add
- Expenses
- Plan
- More

Add button opens a quick action sheet:

- Add Expense
- Add Income
- Add Saving
- Add Investment
- Add Transfer

---

# 7. Design System

## 7.1 Design language

Goal:

**Premium personal finance app + calm household product**

Avoid:

- bank-like complexity
- excessive gradients
- huge decorative cards
- too many colors
- dense tables on mobile
- technical terminology

Prefer:

- generous spacing
- clean white/soft-neutral backgrounds
- one strong primary accent
- subtle semantic colors
- rounded cards
- clear typography hierarchy
- excellent empty states
- simple icons
- clear microcopy

## 7.2 Responsive requirements

Must work smoothly at:

- 360px
- 390px
- 414px
- 768px
- 1024px
- 1280px
- 1440px+

No horizontal scrolling for normal pages.

Tables become cards or horizontally scrollable only where necessary.

## 7.3 Accessibility

Target WCAG 2.2 AA where practical.

Must include:

- keyboard navigation
- visible focus
- semantic labels
- accessible dialogs
- accessible dropdowns
- adequate contrast
- screen-reader labels for icons
- don't use color alone to convey status

## 7.4 Money formatting

Primary:

`320,000 DA`

Support compact display:

`320K DA`

Detailed views use full formatted values.

Never show raw floating-point artifacts.

---

# 8. Dashboard Specification

Dashboard is the most important screen.

## 8.1 Header

Include:

- Family name
- selected month dropdown
- current date
- profile/account menu
- optional quick Add button

## 8.2 Top KPI cards

Exactly six primary KPIs:

1. Net Worth
2. Family Income
3. Total Spending
4. Saving & Investment
5. Remaining
6. Saving Rate

Each KPI may show:

- current value
- previous-month comparison
- small semantic trend indicator

## 8.3 Plan vs Actual

Rows:

- Essentials
- Personal
- Savings
- Investments
- Reserve

Columns:

- Planned %
- Planned amount
- Actual
- Variance
- Status

Use progress bars.

## 8.4 Expense breakdown

Primary level:

- Essentials
- Personal
- Other/uncategorized if any

Detailed breakdown available on click.

## 8.5 Asset allocation

Show:

- Cash
- CCP
- EUR
- USD
- Gold
- Investments
- Other

Chart + values + percentage.

## 8.6 Savings goals

Top goals with:

- progress bar
- current
- target
- remaining
- target date if set

## 8.7 Trends

At minimum:

- income trend
- spending trend
- saving/investment trend
- net worth trend

Default 12-month view.

## 8.8 Financial health

Configurable indicators:

- Savings Rate
- Essentials Ratio
- Investment Rate
- Debt Ratio
- Goal progress

Thresholds come from Settings.

Do not claim these scores are financial advice.

---

# 9. Monthly Plan UX

Design as a guided step-by-step monthly planner.

Step 1:

- Select month.

Step 2:

- Review actual family income.

Step 3:

- Set allocation percentages.

Step 4:

- Review calculated amounts.

Step 5:

- Activate plan.

A visible indicator should show:

`Total allocation: 100%`

If not exactly 100%, block activation.

## Plan revisions

When changing percentages:

- create a new immutable version
- ask for a short reason
- mark previous version as historical
- show revision timeline

Example:

`v1 — Initial August plan`

`v2 — Increased essentials due to wedding expenses`

Never overwrite v1.

---

# 10. Daily Expense UX

Make expense entry extremely simple.

Large:

`Amount`

Then:

- Date defaults to today
- Person defaults to current user
- Main category
- Subcategory
- Account/payment method
- Note optional

After Save:

- display success
- offer `Add another`
- preserve selected category where helpful
- avoid forcing navigation

Quick-add target:
Under 10 seconds for a normal expense.

Provide edit/delete through history.

---

# 11. Income UX

Simple monthly form.

For each person:

- Source
- Month
- Amount
- Currency
- Note

Show:

- Assem total
- Wife total
- Family total

Allow two sources per person by default, but make source records configurable.

---

# 12. Accounts & Assets UX

Use sections:

### Liquid Money

- Cash
- CCP
- EUR
- USD

### Store of Value / Assets

- Gold
- Investments
- Other Assets

Cards should show:

- current value
- currency
- DZD value
- change if available

EUR/USD rate editing should be accessible from Settings and optionally from the account valuation screen with a clear shortcut.

---

# 13. Savings Goals UX

Goal card:

- icon
- goal name
- target
- current
- progress
- remaining
- target date
- priority

Actions:

- Add contribution
- Edit
- Archive
- Delete (with confirmation)

Do not treat a goal contribution as a consumption expense.

---

# 14. Investments UX

Investment card/table:

- name
- type
- purchase cost
- current value
- gain/loss
- return %

Allow manual valuation updates.

Provide total investment value at top.

---

# 15. Liabilities UX

Show:

- total liabilities
- remaining
- next due
- payment progress

Allow:

- create
- edit
- register payment
- close liability

---

# 16. Transfers UX

Simple:

- From account
- To account
- Amount
- Currency
- Date
- Note

Show informational helper:

> Transfers move money between places you already own. They do not count as spending.

---

# 17. Recurring Transactions

Show cards/table with:

- title
- amount
- frequency
- next due date
- category
- active/inactive

Support:

- activate/deactivate
- edit
- duplicate
- archive

Future automation is optional.

Do not automatically create financial transactions unless the user explicitly enables and confirms that behavior.

---

# 18. Reports

Create professional reports with filters:

- month
- year
- person
- main category
- subcategory
- account
- currency

Reports:

1. Monthly financial report
2. Annual report
3. Income report
4. Expense report
5. Saving report
6. Investment report
7. Asset report
8. Net worth report
9. Budget variance report

Allow CSV export.

PDF export can be a later enhancement.

---

# 19. Net Worth Page

Display:

- current net worth
- total assets
- total liabilities
- month-over-month change
- 12-month trend

Break assets down by:

- liquid cash
- CCP
- foreign currency
- gold
- investments
- other

Break liabilities down similarly.

Add a historical monthly snapshot.

Important:
A historical net-worth report must not retroactively change incorrectly just because the current value of gold/EUR/USD changed today.

Implement an explicit monthly snapshot mechanism or valuation-history model when historical accuracy is required.

---

# 20. Settings

Settings must be one of the strongest areas of the application.

## 20.1 Family

- family name
- currency
- timezone
- language
- date format

## 20.2 Members

- view members
- add member
- edit display name
- role
- deactivate member where appropriate

## 20.3 Income sources

Add/edit/remove/reorder sources.

## 20.4 Categories

Full category management:

- add
- edit
- deactivate
- reorder
- parent/child relationship

Do not hard delete categories already used in historical transactions unless absolutely necessary.

Prefer archive/deactivate.

## 20.5 Allocation defaults

Set default monthly percentages.

These defaults should populate a new month's initial plan but must not overwrite historical plans.

## 20.6 Exchange rates

Manual:

- EUR/DZD
- USD/DZD

Show:

- current value
- last updated
- updated by

## 20.7 Financial health thresholds

Editable thresholds for:

- savings rate
- essentials ratio
- investment rate
- debt ratio
- goal progress

## 20.8 Dashboard preferences

Allow:

- compact/full KPI mode
- default dashboard month
- chart range
- default page
- show/hide certain widgets

## 20.9 Security

- change password
- session/security information
- logout all sessions where supported
- account activity

---

# 21. Security Architecture

This is financial data. Treat security as a first-class feature.

## 21.1 RLS

Enable RLS on every exposed application table.

Every family-owned row must only be accessible to authenticated users who belong to that row's `family_id`.

Do not rely only on React route guards.

Database policies are mandatory.

## 21.2 Never expose service keys

Never send:

- service role key
- secret key
- database password

to the browser.

Only use public/publishable Supabase credentials client-side with correct RLS.

## 21.3 Server-side validation

Every Server Action / Route Handler must:

- validate input with Zod
- authenticate user
- resolve user's family membership
- authorize action
- perform DB operation
- return safe errors

Never trust a client-supplied `family_id`.

Derive the family from authenticated membership.

## 21.4 Financial mutation rules

For create/update/delete:

- verify authorization
- validate amount
- validate currency
- validate dates
- prevent negative values unless explicitly supported
- prevent cross-family references
- prevent invalid category references
- prevent duplicate/conflicting state transitions

## 21.5 Password

- no plaintext storage
- no plaintext logging
- no password in URL
- no password in client bundle
- forced initial password change
- password reset through Supabase Auth

## 21.6 Input protection

Handle:

- SQL injection through parameterized Supabase queries
- XSS through React's default escaping + safe rendering
- unsafe HTML / `dangerouslySetInnerHTML` should be avoided
- CSV injection if exports are generated
- CSRF according to the chosen Supabase/Next.js server action architecture
- open redirects

## 21.7 Auditability

Record high-value financial modifications.

Never silently mutate critical financial history without traceability.

---

# 22. Database Migration Rules

All schema changes must be represented as versioned SQL migrations in Git.

Recommended:

```text
supabase/
  migrations/
    0001_initial_schema.sql
    0002_seed_categories.sql
    0003_rls_policies.sql
    0004_monthly_plan_versions.sql
    ...
```

Never make production schema changes manually without creating the corresponding migration.

Each migration must be:

- deterministic
- idempotent where practical
- reviewed
- tested on a local/preview database if available

---

# 23. Seed Data

Seed:

## Members

- Assem
- Wife placeholder

## Income sources

- Assem Source 1
- Assem Source 2
- Wife Source 1
- Wife Source 2

## Expense categories

### Essentials

- Housing
- Food & Groceries
- Electricity
- Gas
- Water
- Internet
- Phone
- Transport
- Fuel
- Health
- Essential Clothing
- Household Supplies
- Wedding Expenses
- Other

### Personal

- Assem
- Wife
- Entertainment
- Hobbies
- Restaurants
- Games
- Personal Subscriptions
- Personal Clothing
- Gifts
- Other

### Savings

- Emergency Fund
- Wedding
- Travel
- Car
- Home
- Other Goal

### Investments

- Investment 1
- Investment 2
- Gold
- Other Asset

### Liabilities

- Loan
- Personal Debt
- Installment
- Other Obligation

All categories must be editable/archivable.

---

# 24. UX Principles for Wife-Friendly Usage

The app must pass this test:

> A person who never saw the implementation plan should be able to add today's expense without asking how.

Rules:

1. Use natural labels.
2. Avoid technical database terminology.
3. Put the most common action first.
4. Use sensible defaults.
5. Reduce typing.
6. Use dropdowns for categories.
7. Remember recent selections where useful.
8. Confirm destructive actions clearly.
9. Use empty states that explain what to do next.
10. Never show an error like `PostgREST 23503`.
11. Convert technical errors into human-readable messages.
12. Keep actions reversible where possible.

Example empty state:

> No expenses recorded for this month yet.
>
> Add today's spending to start tracking your month.

---

# 25. Internationalization

Build the UI so translation is possible from the beginning.

Minimum architecture:

- `en`
- `ar`

Optional:

- `fr`

Do not hardcode user-facing strings throughout components.

The first shipped language can be chosen during implementation, but the application must be translation-ready.

Arabic mode must support RTL correctly if enabled.

---

# 26. Notifications and Feedback

Use toast/inline feedback for:

- saved successfully
- updated successfully
- deleted successfully
- invalid percentages
- failed save
- session expired
- unauthorized action

Never spam notifications.

Use confirmation dialogs only for destructive/high-impact actions.

---

# 27. Error Handling

Create centralized error mapping.

User should see:

> "We couldn't save this expense. Please check the amount and try again."

Not:

> "TypeError: cannot read properties of undefined."

Log technical errors server-side/monitoring as appropriate.

Do not leak:

- SQL statements
- auth internals
- secrets
- stack traces
- database schema details

---

# 28. Testing Strategy

## 28.1 Unit tests

Test financial calculations:

- family income
- planned amounts
- percentages = 100%
- expense totals
- saving rate
- investment rate
- remaining balance
- exchange conversions
- gold gain/loss
- net worth
- debt remaining
- variance
- historical plan versioning

## 28.2 Database tests

Test RLS:

- Assem sees own family
- Wife sees same family
- unauthorized user cannot read family data
- cross-family access fails
- unauthorized updates fail
- unauthorized deletes fail

## 28.3 Integration tests

At minimum:

1. Login
2. First-login password change
3. Add income
4. Add expense
5. Create monthly plan
6. Revise monthly plan
7. Add transfer
8. Update exchange rate
9. Update gold value
10. Add savings goal
11. Add investment
12. Add liability
13. Dashboard recalculation
14. Net worth calculation
15. Logout
16. Password reset

## 28.4 E2E

Use Playwright.

Critical flows must pass on:

- desktop Chromium
- mobile viewport
- authenticated user
- expired session
- unauthorized route
- bad input

---

# 29. Performance

Requirements:

- fast first render
- server-render data-heavy dashboard where appropriate
- avoid fetching entire transaction history when a monthly aggregate is enough
- use indexed columns
- paginate large tables
- use SQL aggregates/views for expensive reporting
- avoid N+1 queries
- cache only where correctness is preserved
- revalidate intelligently

Recommended indexes:

- family_id
- month_key
- transaction_date
- member_id
- category_id
- created_at
- foreign keys used in reporting

---

# 30. Dashboard Data Architecture

Do not make the Dashboard execute dozens of unrelated browser queries.

Prefer:

- server-side dashboard data loader
- database views/functions for aggregates where useful
- one structured dashboard query model
- parallel safe data fetches

Potential server-side response shape:

```ts
type DashboardData = {
  month: string;
  income: {
    assem: number;
    wife: number;
    total: number;
  };
  spending: {
    total: number;
    essentials: number;
    personal: number;
    other: number;
  };
  savings: {
    actual: number;
    planned: number;
  };
  investments: {
    actual: number;
    planned: number;
  };
  remaining: number;
  savingRate: number;
  netWorth: number;
  assets: AssetSummary[];
  goals: GoalSummary[];
  trends: TrendPoint[];
};
```

Do not hardcode sample financial values in production Dashboard code.

---

# 31. Recommended Application Structure

Suggested:

```text
app/
  (auth)/
    login/
    forgot-password/
    reset-password/
    change-password/

  (app)/
    dashboard/
    monthly-plan/
    expenses/
    income/
    accounts/
    assets/
    goals/
    investments/
    liabilities/
    transfers/
    recurring/
    net-worth/
    reports/
    settings/

  api/
    ...

components/
  ui/
  dashboard/
  finance/
  charts/
  forms/
  layout/

lib/
  supabase/
    client.ts
    server.ts
  auth/
  finance/
  permissions/
  validation/
  formatting/
  calculations/
  queries/

types/
  database.ts
  finance.ts

supabase/
  migrations/
  seed/

tests/
  unit/
  integration/
  e2e/
```

Adapt to the existing repository rather than blindly replacing existing code.

---

# 32. Environment Variables

Expected client-safe variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Server-only variables if actually required:

```env
SUPABASE_SECRET_KEY=
BOOTSTRAP_ADMIN_EMAIL=
BOOTSTRAP_ADMIN_PASSWORD=
```

Rules:

- Never commit `.env.local`
- Never expose secret/service role variables through `NEXT_PUBLIC_*`
- Never hardcode secrets
- Configure Vercel environment variables per environment
- Use separate development/preview/production values when appropriate

---

# 33. Vercel Deployment

Production branch:

`main`

Flow:

```text
Developer/Agent
      ↓
GitHub branch
      ↓
Pull Request
      ↓
Vercel Preview
      ↓
Tests / review
      ↓
Merge to main
      ↓
Vercel Production
```

Deployment requirements:

- build must pass
- TypeScript must pass
- ESLint must pass
- tests must pass
- environment variables must exist
- database migrations must be applied in correct order

Never run destructive production DB migrations automatically without an explicit controlled deployment step.

---

# 34. Supabase Deployment

Use migrations.

Production database must be reproducible from Git.

Required:

- RLS enabled
- policies created
- indexes created
- seed/configuration applied
- security review completed
- auth settings configured

Run Supabase Security Advisor before production release.

---

# 35. Backups and Recovery

Document:

- database backup approach
- recovery approach
- how to export data
- how to restore a project

Do not rely only on source-code backups.

The financial data is more important than the application code.

Provide an application-level export:

- CSV
- JSON

for the family's financial data.

Optional later:

- encrypted full backup bundle

---

# 36. Data Export

Allow Owner to export:

- all income
- all expenses
- all plans
- plan revision history
- accounts
- assets
- investments
- goals
- liabilities
- transfers
- recurring transactions
- net worth history

CSV files should be clean and spreadsheet-friendly.

PDF export can be a later enhancement.

---

# 37. Data Deletion Rules

Do not provide casual hard deletion for critical financial records.

Prefer:

- archive
- deactivate
- soft delete

Where a delete is necessary:

- confirm
- log audit event
- check dependencies

Historical financial records should remain intact unless the owner explicitly performs a supported destructive operation.

---

# 38. Implementation Roadmap — Exactly 4 Phases / 2 Subphases Each

# PHASE 1 — FOUNDATION & SECURITY

## 1A — Project Foundation

Tasks:

- audit existing Next.js repository before changing architecture
- verify current Next.js version
- verify TypeScript and App Router setup
- install/verify Tailwind
- install/verify shadcn/ui or chosen component library
- install Supabase SSR integration
- configure browser/server Supabase clients
- configure current Supabase auth/session flow
- establish project folder architecture
- establish design tokens
- establish error handling
- establish Zod validation
- establish formatting utilities
- establish test framework
- establish CI checks
- configure `.env.example`
- remove demo/template code
- create base application shell

Acceptance criteria:

- app starts locally
- build succeeds
- lint succeeds
- TypeScript succeeds
- Supabase connection works
- session can be read server-side
- no secrets are committed

## 1B — Database, Auth & RLS

Tasks:

- create schema migrations
- create families/profile/member model
- create all core financial tables
- create indexes
- implement monthly plan versioning
- implement audit log
- implement seed categories
- implement RLS for every exposed table
- implement family membership policies
- implement owner/member roles
- create bootstrap owner account flow
- set username `assemkh`
- set bootstrap password through secret configuration only
- enforce first-login password change
- implement username login resolution
- implement password reset
- implement change password
- implement logout
- test unauthorized access

Acceptance criteria:

- `assemkh` can log in
- first login forces password change
- user cannot bypass first-login password change
- data cannot cross family boundaries
- service/secret keys are never in browser code
- RLS tests pass

---

# PHASE 2 — CORE FINANCE ENGINE

## 2A — Income, Expenses, Accounts & Transactions

Tasks:

- build Income page
- build Daily Expense page
- build Accounts page
- build Assets page
- build Transfers page
- build Investment page
- build Liabilities page
- build Recurring page
- build validation
- build category dropdowns
- build person dropdowns
- build currency handling
- build manual EUR/USD rates
- build gold purchase/current values
- implement all calculation helpers
- ensure transfers do not count as spending
- build mobile quick-add workflow

Acceptance criteria:

- Assem can add monthly income
- Wife can add monthly income
- daily expense entry works in under 10 seconds for normal use
- categories are selectable
- accounts show current balances
- EUR/USD convert correctly
- gold gain/loss calculates correctly
- transfers do not inflate spending
- liabilities calculate remaining correctly

## 2B — Monthly Planning, Savings & Net Worth Engine

Tasks:

- build Monthly Plan page
- build versioning/history
- build plan-revision modal
- require reason for plan revision
- enforce 100% allocation
- build Savings Goals
- build explicit Savings records/events
- connect actual savings to dashboard
- connect actual investments to dashboard
- build Net Worth calculations
- build monthly snapshots/valuation history where required
- build Monthly Summary
- build Annual Report foundation

Acceptance criteria:

- new month can be created
- plan percentages calculate automatically
- invalid total percentages cannot be activated
- changing plan creates a new version
- previous version remains viewable
- actual savings are based on real records, not planned percentages
- actual investments are based on real records
- net worth is correct
- monthly summary reconciles with source data

---

# PHASE 3 — PREMIUM UX & ANALYTICS

## 3A — Dashboard & Reports

Tasks:

- build premium Dashboard
- add monthly selector
- add KPI cards
- add Plan vs Actual
- add expense breakdown
- add asset allocation
- add goals
- add income trend
- add spending trend
- add saving/investment trend
- add net worth trend
- add financial health indicators
- build reports pages
- build filters
- build CSV export
- add loading/skeleton states
- add empty states
- add error states

Acceptance criteria:

- Dashboard is understandable without documentation
- all numbers are source-driven
- changing month updates dashboard
- charts match raw data
- mobile Dashboard is usable
- no chart overlaps or unreadable labels
- financial-health colors are semantic and configurable

## 3B — Settings, Localization & UX Polish

Tasks:

- build Settings
- family settings
- member settings
- category management
- income-source management
- exchange-rate management
- allocation-default management
- financial-health threshold management
- dashboard preference management
- security settings
- password management
- localization architecture
- Arabic RTL support
- English support
- responsive refinements
- keyboard/accessibility refinements
- confirmation dialogs
- toasts
- helpful error messages
- onboarding/help tooltips for first-time users

Acceptance criteria:

- user can modify categories without developer help
- user can modify exchange rates without developer help
- user can change default allocation rules
- user can change password
- Arabic RTL does not break layout
- UI remains simple on mobile
- no raw technical errors are shown to users

---

# PHASE 4 — HARDENING, TESTING & PRODUCTION

## 4A — Testing, Security & Data Integrity

Tasks:

- unit tests for all finance calculations
- integration tests for core workflows
- RLS tests
- authentication tests
- authorization tests
- E2E tests with Playwright
- mobile viewport tests
- accessibility checks
- performance profiling
- large transaction list tests
- invalid-input testing
- plan-version history testing
- exchange-rate update testing
- net-worth reconciliation tests
- transfer-accounting tests
- audit-log tests
- dependency/security audit
- Supabase Security Advisor
- review all browser/client bundles for secrets

Acceptance criteria:

- all critical tests pass
- RLS verified
- no secret leakage
- no critical financial calculation mismatches
- no critical accessibility issue
- no production-blocking console errors

## 4B — Production Deployment & Final QA

Tasks:

- create production Vercel environment variables
- configure Supabase production settings
- apply migrations
- seed initial configuration
- create/verify `assemkh`
- ensure initial password change requirement
- connect production domain
- verify HTTPS
- verify login
- verify logout
- verify password change
- verify password reset
- verify dashboard
- verify CRUD operations
- verify exports
- verify mobile usage
- verify backup/export process
- create deployment runbook
- create recovery runbook
- tag first release

Final acceptance:

The app is only considered production-ready when an end user can:

1. Open the URL.
2. Login as `assemkh`.
3. Change the initial password.
4. See the dashboard.
5. Enter monthly income.
6. Enter the monthly allocation.
7. Add a daily expense.
8. See the dashboard update.
9. Add savings/investment.
10. Update EUR/USD rates.
11. Update gold value.
12. See Net Worth update.
13. View reports.
14. Change settings.
15. Logout.
16. Login again using the new password.

---

# 39. Agent Execution Rules

All AI coding agents must follow these rules.

## Rule 1 — Inspect before modifying

Before changing code:

- inspect repository
- inspect existing package.json
- inspect existing app structure
- inspect existing Supabase integration
- inspect current environment variables
- inspect current migration state

Do not blindly recreate the project.

## Rule 2 — Preserve working infrastructure

Do not replace:

- Vercel
- Supabase
- GitHub
- existing working Next.js setup

unless a real blocker exists.

## Rule 3 — Small coherent commits

Each logical implementation unit should be committed separately.

Preferred commit style:

```text
feat(auth): implement username login
feat(db): add monthly plan versioning
feat(finance): add expense tracking
feat(dashboard): add plan vs actual
fix(net-worth): correct transfer handling
test(rls): add cross-family isolation coverage
```

## Rule 4 — Never weaken security to make a feature work

Do not:

- disable RLS
- use service role in the browser
- bypass auth checks
- trust client-provided family_id
- expose secrets
- store passwords in app tables

## Rule 5 — No fake financial data

Demo/sample data must never appear in the production family.

Use explicit seeded configuration only.

## Rule 6 — No hardcoded calculations in JSX

Financial calculations belong in:

- typed calculation functions
- server/database aggregation
- dedicated finance services

not scattered across visual components.

## Rule 7 — Every feature requires acceptance criteria

Before considering a feature complete:

- functionality
- validation
- mobile behavior
- authorization
- error states
- loading states
- tests

must be addressed.

---

# 40. Definition of Done

A feature is DONE only when:

- UI works
- mobile works
- loading state works
- empty state works
- error state works
- validation works
- DB migration exists
- RLS policy exists/verified
- TypeScript passes
- lint passes
- tests pass
- no unnecessary duplication
- no secrets exposed
- no console errors
- user-facing copy is understandable
- audit requirements are satisfied if relevant

---

# 41. Final UX Vision

The application should feel like:

> **A calm private family financial cockpit.**

Not:

> accounting software.

The most important user journey is:

```text
Login
  ↓
Dashboard
  ↓
"How are we doing?"
  ↓
See Income / Spending / Savings / Net Worth
  ↓
Add Today's Expense
  ↓
Done
```

Monthly journey:

```text
New Month
  ↓
Enter income
  ↓
Set percentages
  ↓
Use app during month
  ↓
Review Plan vs Actual
  ↓
Update goals/assets
  ↓
Review Net Worth
```

The user should never need to understand:

- SQL
- database tables
- RLS
- API calls
- React state
- authentication internals
- financial formulas

Those are implementation concerns.

The family sees only a clean and trustworthy financial experience.

---

# 42. Reference Documentation

Implementation agents must prefer current official documentation over outdated training knowledge.

Use:

- Supabase Next.js Auth/SSR: https://supabase.com/docs/guides/auth/server-side
- Supabase Next.js quickstart: https://supabase.com/docs/guides/auth/quickstarts/nextjs
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase security: https://supabase.com/docs/guides/security
- Supabase production checklist: https://supabase.com/docs/guides/deployment/going-into-prod
- Next.js documentation: https://nextjs.org/docs
- Vercel documentation: https://vercel.com/docs

Agents should re-check current official documentation if APIs or package behavior differ from this plan.

---

# 43. Final Deliverable

The final product must be:

**Family Finance Management**

with:

- secure login
- shared family model
- monthly-first planning
- editable plan revisions
- daily expense capture
- income tracking for Assem + Wife
- accounts and assets
- EUR/USD manual conversion
- gold valuation
- savings goals
- investments
- liabilities
- transfers
- recurring transactions
- net worth
- reports
- professional dashboard
- configurable settings
- auditability
- responsive UI
- Arabic/English-ready architecture
- strong Supabase RLS
- Vercel deployment
- automated tests
- low operational complexity

The implementation should prioritize **correctness, simplicity, security, and maintainability over unnecessary feature count**.
