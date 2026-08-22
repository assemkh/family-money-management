begin;

create extension if not exists pgtap with schema extensions;

select plan(26);

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000001', 'engine-a@example.test'),
  ('20000000-0000-0000-0000-000000000001', 'engine-b@example.test');

insert into public.families (id, name)
values
  ('a0000000-0000-0000-0000-000000000001', 'Engine Family A'),
  ('b0000000-0000-0000-0000-000000000001', 'Engine Family B');

insert into public.profiles (id, family_id, display_name, username, role)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Engine A',
    'engine_a',
    'owner'
  ),
  (
    '20000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Engine B',
    'engine_b',
    'owner'
  );

insert into public.accounts (
  id,
  family_id,
  name,
  type,
  currency,
  current_balance,
  sort_order
)
values
  (
    'a1000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Cash',
    'cash',
    'DZD',
    1000,
    10
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'EUR',
    'foreign_currency',
    'EUR',
    10,
    20
  ),
  (
    'b1000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'USD',
    'foreign_currency',
    'USD',
    10,
    10
  );

insert into public.assets (
  family_id,
  asset_type,
  name,
  purchase_value,
  current_value,
  currency
)
values (
  'a0000000-0000-0000-0000-000000000001',
  'gold',
  'Gold',
  400,
  500,
  'DZD'
);

insert into public.investments (
  id,
  family_id,
  name,
  type,
  purchase_cost,
  current_value,
  currency
)
values
  (
    'a3000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Family fund',
    'fund',
    800,
    1000,
    'DZD'
  ),
  (
    'b3000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Other family fund',
    'fund',
    100,
    100,
    'DZD'
  );

insert into public.liabilities (
  family_id,
  name,
  type,
  original_amount,
  paid_amount,
  currency,
  status
)
values (
  'a0000000-0000-0000-0000-000000000001',
  'Debt',
  'loan',
  1000,
  200,
  'DZD',
  'active'
);

insert into public.exchange_rates (
  family_id,
  currency,
  rate_to_base,
  effective_date
)
values (
  'a0000000-0000-0000-0000-000000000001',
  'EUR',
  200,
  current_date - 1
);

insert into public.net_worth_snapshots (
  family_id,
  snapshot_month,
  accounts_dzd,
  assets_dzd,
  investments_dzd,
  liabilities_dzd,
  total_assets_dzd,
  total_liabilities_dzd,
  net_worth_dzd,
  captured_by
)
values (
  'b0000000-0000-0000-0000-000000000001',
  date_trunc('month', current_date)::date,
  100,
  0,
  0,
  0,
  100,
  0,
  100,
  '20000000-0000-0000-0000-000000000001'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select ok(
  has_function_privilege(
    'authenticated',
    'public.record_investment_event(uuid,date,numeric,text,text)',
    'execute'
  ),
  'authenticated family members can record investment events'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.record_investment_event(uuid,date,numeric,text,text)',
    'execute'
  ),
  'anonymous callers cannot record investment events'
);

select ok(
  not has_table_privilege('authenticated', 'public.financial_transactions', 'insert'),
  'direct ledger inserts remain blocked'
);

select ok(
  not has_table_privilege('authenticated', 'public.net_worth_snapshots', 'insert'),
  'direct snapshot inserts are blocked'
);

select lives_ok(
  $$select public.record_investment_event(
    'a3000000-0000-0000-0000-000000000001',
    current_date,
    200,
    'DZD',
    'Monthly investment'
  )$$,
  'an investment event and position update commit together'
);

select results_eq(
  $$select purchase_cost from public.investments where name = 'Family fund'$$,
  array[1000::numeric],
  'the event increases invested cost'
);

select results_eq(
  $$select current_value from public.investments where name = 'Family fund'$$,
  array[1200::numeric],
  'newly invested cash initially increases current value'
);

select results_eq(
  $$
    select type::text || ':' || source_table
    from public.financial_transactions
    where note = 'Monthly investment'
  $$,
  array['investment:investments'::text],
  'actual investment is an explicit linked ledger event'
);

select results_eq(
  $$select member_id from public.financial_transactions where note = 'Monthly investment'$$,
  array['10000000-0000-0000-0000-000000000001'::uuid],
  'the investment event preserves member attribution'
);

select throws_ok(
  $$select public.record_investment_event(
    'a3000000-0000-0000-0000-000000000001',
    current_date,
    10,
    'EUR',
    null
  )$$,
  '22023',
  'Investment and event currencies must match',
  'investment events cannot silently convert currency'
);

select throws_ok(
  $$select public.record_investment_event(
    'b3000000-0000-0000-0000-000000000001',
    current_date,
    10,
    'DZD',
    null
  )$$,
  '22023',
  'Invalid family investment',
  'investment events cannot target another family'
);

select lives_ok(
  $$select public.capture_net_worth_snapshot(date_trunc('month', current_date)::date)$$,
  'the current month net worth can be captured'
);

select results_eq(
  $$select accounts_dzd from public.net_worth_snapshots where family_id = 'a0000000-0000-0000-0000-000000000001'$$,
  array[3000::numeric],
  'account balances use the current manual EUR rate'
);

select results_eq(
  $$select assets_dzd from public.net_worth_snapshots where family_id = 'a0000000-0000-0000-0000-000000000001'$$,
  array[500::numeric],
  'asset current values are included'
);

select results_eq(
  $$select investments_dzd from public.net_worth_snapshots where family_id = 'a0000000-0000-0000-0000-000000000001'$$,
  array[1200::numeric],
  'investment current values are included'
);

select results_eq(
  $$select liabilities_dzd from public.net_worth_snapshots where family_id = 'a0000000-0000-0000-0000-000000000001'$$,
  array[800::numeric],
  'only outstanding liabilities are included'
);

select results_eq(
  $$select total_assets_dzd from public.net_worth_snapshots where family_id = 'a0000000-0000-0000-0000-000000000001'$$,
  array[4700::numeric],
  'total assets reconcile with their components'
);

select results_eq(
  $$select net_worth_dzd from public.net_worth_snapshots where family_id = 'a0000000-0000-0000-0000-000000000001'$$,
  array[3900::numeric],
  'net worth equals assets minus liabilities'
);

select results_eq(
  $$select (rates_snapshot ->> 'EUR')::numeric from public.net_worth_snapshots where family_id = 'a0000000-0000-0000-0000-000000000001'$$,
  array[200::numeric],
  'the snapshot preserves the exchange rate used'
);

select results_eq(
  $$select count(*) from public.net_worth_snapshots where family_id = 'a0000000-0000-0000-0000-000000000001'$$,
  array[1::bigint],
  'there is one logical snapshot per family month'
);

reset role;
insert into public.exchange_rates (
  family_id,
  currency,
  rate_to_base,
  effective_date
)
values (
  'a0000000-0000-0000-0000-000000000001',
  'EUR',
  250,
  current_date
);
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$select public.capture_net_worth_snapshot(date_trunc('month', current_date)::date)$$,
  'the open current-month snapshot can be refreshed'
);

select results_eq(
  $$select count(*) from public.net_worth_snapshots where family_id = 'a0000000-0000-0000-0000-000000000001'$$,
  array[1::bigint],
  'refreshing does not duplicate the monthly snapshot'
);

select results_eq(
  $$select net_worth_dzd from public.net_worth_snapshots where family_id = 'a0000000-0000-0000-0000-000000000001'$$,
  array[4400::numeric],
  'the open snapshot refreshes from the latest manual rate'
);

select throws_ok(
  $$select public.capture_net_worth_snapshot((date_trunc('month', current_date) - interval '1 month')::date)$$,
  '22023',
  'Only the current month can be captured',
  'closed historical months cannot be rewritten'
);

select results_eq(
  $$select count(*) from public.net_worth_snapshots where family_id = 'b0000000-0000-0000-0000-000000000001'$$,
  array[0::bigint],
  'RLS hides another family snapshots'
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select public.capture_net_worth_snapshot(date_trunc('month', current_date)::date)$$,
  '22023',
  'Missing current exchange rate for: USD',
  'a snapshot fails closed when a required exchange rate is missing'
);

reset role;
select * from finish();
rollback;
