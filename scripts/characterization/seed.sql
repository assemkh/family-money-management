-- Characterization fixture for Phase 2.B.
--
-- Local-test-only. Seeds one Household with fixed identifiers and month-relative
-- dates so every read model returns a stable, fully populated view model. Snapshot
-- comparisons then prove that extracting the domain Modules changed no financial
-- output. Never run this against a linked project.
--
-- Coverage the Phase 1.A performance fixture does not have: two Members, three
-- currencies, one currency with no rate (incomplete Valuation), a child category,
-- transfers, assets, investments with an event, liabilities, a recurring commitment,
-- a savings goal with a contribution, an immutable plan revision, and a snapshot.

do $$
begin

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  )
  values
    ('20000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'phase2b.owner@characterization.invalid', '$2a$10$characterizationfixtureonlyxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
     now(), now(), now(), '{"account_type":"household_owner"}'::jsonb, '{}'::jsonb),
    ('20000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'phase2b.member@characterization.invalid', '$2a$10$characterizationfixtureonlyxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
     now(), now(), now(), '{"account_type":"household_member"}'::jsonb, '{}'::jsonb);

  insert into public.families (id, name, base_currency, timezone, locale, date_format)
  values ('20000000-0000-4000-8000-000000000001', 'Phase 2B Characterization Household', 'DZD', 'Africa/Algiers', 'en', 'dd/MM/yyyy');

  insert into public.profiles (id, family_id, display_name, username, role, must_change_password, is_active)
  values
    ('20000000-0000-4000-8000-000000000002',  '20000000-0000-4000-8000-000000000001', 'Characterization Owner',  'phase2b_owner',  'owner',  false, true),
    ('20000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'Characterization Member', 'phase2b_member', 'member', false, true);

  insert into public.income_sources (id, family_id, name, owner_member_id, sort_order, created_by)
  values
    ('20000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000001', 'Characterization salary',   '20000000-0000-4000-8000-000000000002',  10, '20000000-0000-4000-8000-000000000002'),
    ('20000000-0000-4000-8000-000000000102', '20000000-0000-4000-8000-000000000001', 'Characterization freelance', '20000000-0000-4000-8000-000000000003', 20, '20000000-0000-4000-8000-000000000002');

  insert into public.expense_categories (id, family_id, parent_category_id, name, type, sort_order, created_by)
  values
    ('20000000-0000-4000-8000-000000000201', '20000000-0000-4000-8000-000000000001', null, 'Characterization essentials', 'essentials', 10, '20000000-0000-4000-8000-000000000002'),
    ('20000000-0000-4000-8000-000000000203', '20000000-0000-4000-8000-000000000001', null, 'Characterization personal',   'personal',   30, '20000000-0000-4000-8000-000000000002');
  insert into public.expense_categories (id, family_id, parent_category_id, name, type, sort_order, created_by)
  values
    ('20000000-0000-4000-8000-000000000202', '20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000201',
     'Characterization groceries', 'essentials', 20, '20000000-0000-4000-8000-000000000002');

  insert into public.accounts (id, family_id, name, type, currency, current_balance, sort_order, created_by)
  values
    ('20000000-0000-4000-8000-000000000301', '20000000-0000-4000-8000-000000000001', 'Characterization cash',   'cash', 'DZD', 250000, 10, '20000000-0000-4000-8000-000000000002'),
    ('20000000-0000-4000-8000-000000000302', '20000000-0000-4000-8000-000000000001', 'Characterization euro',   'foreign_currency', 'EUR', 1200, 20, '20000000-0000-4000-8000-000000000002'),
    -- USD deliberately has no exchange rate, so every multi-currency total exercises
    -- the incomplete Valuation path alongside the complete one.
    ('20000000-0000-4000-8000-000000000303', '20000000-0000-4000-8000-000000000001', 'Characterization dollar', 'foreign_currency', 'USD', 800, 30, '20000000-0000-4000-8000-000000000002'),
    ('20000000-0000-4000-8000-000000000304', '20000000-0000-4000-8000-000000000001', 'Characterization bank', 'bank', 'DZD', 90000, 40, '20000000-0000-4000-8000-000000000002');

  insert into public.exchange_rates (id, family_id, currency, rate_to_base, effective_date, created_by)
  values ('20000000-0000-4000-8000-000000000401', '20000000-0000-4000-8000-000000000001', 'EUR', 145.500000,
          (date_trunc('month', current_date) - interval '1 month')::date, '20000000-0000-4000-8000-000000000002');

  insert into public.income_entries (id, family_id, member_id, source_id, income_month, amount, currency, note, created_by)
  values
    ('20000000-0000-4000-8000-000000000501', '20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002',  '20000000-0000-4000-8000-000000000101',
     date_trunc('month', current_date)::date, 180000, 'DZD', 'Characterization salary', '20000000-0000-4000-8000-000000000002'),
    ('20000000-0000-4000-8000-000000000502', '20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000102',
     date_trunc('month', current_date)::date, 400, 'EUR', 'Characterization freelance', '20000000-0000-4000-8000-000000000002'),
    ('20000000-0000-4000-8000-000000000503', '20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002',  '20000000-0000-4000-8000-000000000101',
     (date_trunc('month', current_date) - interval '1 month')::date, 175000, 'DZD', 'Characterization previous month', '20000000-0000-4000-8000-000000000002');

  insert into public.expense_entries (id, family_id, member_id, transaction_date, main_category, subcategory_id, amount, currency, payment_account_id, note, created_by)
  values
    ('20000000-0000-4000-8000-000000000601', '20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002',
     date_trunc('month', current_date)::date + 4, 'essentials', '20000000-0000-4000-8000-000000000201',
     42000, 'DZD', '20000000-0000-4000-8000-000000000301', 'Characterization rent', '20000000-0000-4000-8000-000000000002'),
    ('20000000-0000-4000-8000-000000000602', '20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003',
     date_trunc('month', current_date)::date + 11, 'essentials', '20000000-0000-4000-8000-000000000202',
     13500, 'DZD', '20000000-0000-4000-8000-000000000301', 'Characterization groceries', '20000000-0000-4000-8000-000000000002'),
    ('20000000-0000-4000-8000-000000000603', '20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002',
     (date_trunc('month', current_date) - interval '1 month')::date + 19, 'personal', '20000000-0000-4000-8000-000000000203',
     60, 'EUR', null, 'Characterization personal', '20000000-0000-4000-8000-000000000002');

  insert into public.transfers (id, family_id, transfer_date, from_account_id, to_account_id, amount, currency, note, created_by)
  values ('20000000-0000-4000-8000-000000000701', '20000000-0000-4000-8000-000000000001', date_trunc('month', current_date)::date + 9,
          '20000000-0000-4000-8000-000000000301', '20000000-0000-4000-8000-000000000304', 15000, 'DZD',
          'Characterization transfer', '20000000-0000-4000-8000-000000000002');

  insert into public.assets (id, family_id, asset_type, name, purchase_value, current_value, currency, purchase_date, notes, created_by)
  values ('20000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000001', 'gold', 'Characterization gold',
          300000, 320000, 'DZD', (date_trunc('month', current_date) - interval '1 month')::date,
          'Characterization asset', '20000000-0000-4000-8000-000000000002');

  insert into public.investments (id, family_id, name, type, purchase_cost, current_value, currency, purchase_date, notes, created_by)
  values ('20000000-0000-4000-8000-000000000901', '20000000-0000-4000-8000-000000000001', 'Characterization fund', 'fund',
          1200, 1500, 'USD', (date_trunc('month', current_date) - interval '1 month')::date + 4,
          'Characterization investment', '20000000-0000-4000-8000-000000000002');

  insert into public.liabilities (id, family_id, name, type, original_amount, paid_amount, currency, due_date, monthly_payment, status, notes, created_by)
  values ('20000000-0000-4000-8000-000000000a01', '20000000-0000-4000-8000-000000000001', 'Characterization loan', 'loan',
          240000, 60000, 'DZD', (date_trunc('month', current_date) + interval '6 months')::date,
          12000, 'active', 'Characterization liability', '20000000-0000-4000-8000-000000000002');

  insert into public.recurring_transactions (id, family_id, name, type, category_id, amount, currency, frequency, next_due_date, active, notes, created_by)
  values ('20000000-0000-4000-8000-000000000b01', '20000000-0000-4000-8000-000000000001', 'Characterization subscription', 'expense',
          '20000000-0000-4000-8000-000000000201', 9000, 'DZD', 'monthly',
          date_trunc('month', current_date)::date + 24, true, 'Characterization recurring', '20000000-0000-4000-8000-000000000002');

  insert into public.savings_goals (id, family_id, name, target_amount, current_amount, currency, target_date, priority, status, notes, created_by)
  values ('20000000-0000-4000-8000-000000000c01', '20000000-0000-4000-8000-000000000001', 'Characterization emergency fund',
          500000, 50000, 'DZD', (date_trunc('month', current_date) + interval '6 months')::date,
          1, 'active', 'Characterization goal', '20000000-0000-4000-8000-000000000002');

  insert into public.financial_transactions (id, family_id, member_id, transaction_date, type, amount, currency, source_table, source_id, note, created_by)
  values
    ('20000000-0000-4000-8000-000000000d01', '20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002',
     date_trunc('month', current_date)::date + 7, 'saving', 30000, 'DZD',
     'savings_goals', '20000000-0000-4000-8000-000000000c01', 'Characterization contribution', '20000000-0000-4000-8000-000000000002'),
    ('20000000-0000-4000-8000-000000000d02', '20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003',
     date_trunc('month', current_date)::date + 8, 'investment', 300, 'USD',
     'investments', '20000000-0000-4000-8000-000000000901', 'Characterization investment event', '20000000-0000-4000-8000-000000000002');

  insert into public.monthly_plans (id, family_id, month_key, status, created_by)
  values ('20000000-0000-4000-8000-000000000e01', '20000000-0000-4000-8000-000000000001', date_trunc('month', current_date)::date, 'active', '20000000-0000-4000-8000-000000000002');

  insert into public.monthly_plan_versions (id, monthly_plan_id, family_id, version_number, reason,
    essentials_percent, personal_percent, savings_percent, investment_percent, reserve_percent, created_by)
  values
    ('20000000-0000-4000-8000-000000000e11', '20000000-0000-4000-8000-000000000e01', '20000000-0000-4000-8000-000000000001', 1,
     'Characterization baseline revision', 55, 10, 15, 15, 5, '20000000-0000-4000-8000-000000000002'),
    ('20000000-0000-4000-8000-000000000e12', '20000000-0000-4000-8000-000000000e01', '20000000-0000-4000-8000-000000000001', 2,
     'Characterization corrected revision', 50, 10, 20, 15, 5, '20000000-0000-4000-8000-000000000002');

  update public.monthly_plans
  set current_version_id = '20000000-0000-4000-8000-000000000e12'
  where id = '20000000-0000-4000-8000-000000000e01';

  insert into public.net_worth_snapshots (id, family_id, snapshot_month, accounts_dzd, assets_dzd,
    investments_dzd, liabilities_dzd, total_assets_dzd, total_liabilities_dzd, net_worth_dzd,
    rates_snapshot, captured_by)
  values ('20000000-0000-4000-8000-000000000f01', '20000000-0000-4000-8000-000000000001',
          (date_trunc('month', current_date) - interval '1 month')::date,
          424600, 320000, 0, 180000, 744600, 180000, 564600,
          '{"DZD": 1, "EUR": 145.5}'::jsonb, '20000000-0000-4000-8000-000000000002');

  insert into public.settings (id, family_id, key, value, created_by)
  values
    ('20000000-0000-4000-8000-000000001001', '20000000-0000-4000-8000-000000000001', 'allocation.defaults',
     '{"essentials":50,"personal":10,"savings":20,"investment":15,"reserve":5}'::jsonb, '20000000-0000-4000-8000-000000000002'),
    ('20000000-0000-4000-8000-000000001002', '20000000-0000-4000-8000-000000000001', 'dashboard.preferences',
     '{"defaultMonth":"current","kpiMode":"full","showBreakdowns":true,"showGoals":true,"showHealth":true,"showNetWorth":true,"showPlan":true,"trendRange":6}'::jsonb, '20000000-0000-4000-8000-000000000002'),
    ('20000000-0000-4000-8000-000000001003', '20000000-0000-4000-8000-000000000001', 'financial_health.thresholds',
     '{"positiveSavingRate":20,"neutralSavingRate":10,"positivePlanVariance":0.1,"warningPlanVariance":0.25}'::jsonb, '20000000-0000-4000-8000-000000000002');
end;
$$;
