begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

insert into auth.users (id, email)
values
  ('52000000-0000-4000-8000-000000000001', 'rpc-owner@example.test'),
  ('52000000-0000-4000-8000-000000000002', 'rpc-member@example.test');

insert into public.families (id, name)
values ('e2000000-0000-4000-8000-000000000001', 'RPC Guard Family');

insert into public.profiles (id, family_id, display_name, username, role, is_active)
values
  (
    '52000000-0000-4000-8000-000000000001',
    'e2000000-0000-4000-8000-000000000001',
    'RPC Owner',
    'rpc_owner',
    'owner',
    true
  ),
  (
    '52000000-0000-4000-8000-000000000002',
    'e2000000-0000-4000-8000-000000000001',
    'RPC Member',
    'rpc_member',
    'member',
    false
  );

insert into public.accounts (id, family_id, name, type, currency, current_balance)
values
  (
    'a2000000-0000-4000-8000-000000000001',
    'e2000000-0000-4000-8000-000000000001',
    'RPC Wallet',
    'cash',
    'DZD',
    10000
  ),
  (
    'a2000000-0000-4000-8000-000000000002',
    'e2000000-0000-4000-8000-000000000001',
    'RPC Savings',
    'bank',
    'DZD',
    5000
  );

insert into public.expense_categories (id, family_id, name, type)
values (
  'c2000000-0000-4000-8000-000000000001',
  'e2000000-0000-4000-8000-000000000001',
  'RPC Food',
  'essentials'
);

insert into public.savings_goals (
  id,
  family_id,
  name,
  target_amount,
  currency
)
values (
  'b2000000-0000-4000-8000-000000000001',
  'e2000000-0000-4000-8000-000000000001',
  'RPC Goal',
  50000,
  'DZD'
);

insert into public.investments (
  id,
  family_id,
  name,
  type,
  currency
)
values (
  'd2000000-0000-4000-8000-000000000001',
  'e2000000-0000-4000-8000-000000000001',
  'RPC Fund',
  'fund',
  'DZD'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '52000000-0000-4000-8000-000000000002',
  true
);

select throws_ok(
  $$select public.record_expense(
    'c2000000-0000-4000-8000-000000000001',
    current_date,
    100,
    'DZD',
    null,
    null
  )$$,
  '42501',
  'Active family membership required',
  'a paused member cannot record an expense through the privileged RPC'
);

select throws_ok(
  $$select public.set_account_balance(
    'a2000000-0000-4000-8000-000000000001',
    99999
  )$$,
  '42501',
  'Active family membership required',
  'a paused member cannot change an account balance through the privileged RPC'
);

select throws_ok(
  $$select public.record_transfer(
    'a2000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000002',
    current_date,
    100,
    null
  )$$,
  '42501',
  'Active family membership required',
  'a paused member cannot transfer money through the privileged RPC'
);

select throws_ok(
  $$select public.save_monthly_plan(
    date_trunc('month', current_date)::date,
    'Blocked paused-member revision',
    50,
    20,
    10,
    10,
    10
  )$$,
  '42501',
  'Active family membership required',
  'a paused member cannot save a monthly plan through the privileged RPC'
);

select throws_ok(
  $$select public.create_savings_goal(
    'Blocked goal',
    10000::numeric,
    'DZD'::text,
    null::date,
    3::smallint,
    null::text
  )$$,
  '42501',
  'Active family membership required',
  'a paused member cannot create a savings goal through the privileged RPC'
);

select throws_ok(
  $$select public.record_saving_contribution(
    current_date,
    100,
    'DZD',
    null,
    null
  )$$,
  '42501',
  'Active family membership required',
  'a paused member cannot record savings through the privileged RPC'
);

select throws_ok(
  $$select public.set_savings_goal_status(
    'b2000000-0000-4000-8000-000000000001',
    'paused'
  )$$,
  '42501',
  'Active family membership required',
  'a paused member cannot change goal status through the privileged RPC'
);

select throws_ok(
  $$select public.record_investment_event(
    'd2000000-0000-4000-8000-000000000001',
    current_date,
    100,
    'DZD',
    null
  )$$,
  '42501',
  'Active family membership required',
  'a paused member cannot record an investment through the privileged RPC'
);

select throws_ok(
  $$select public.capture_net_worth_snapshot(
    date_trunc('month', timezone('Africa/Algiers', now()))::date
  )$$,
  '42501',
  'Active family membership required',
  'a paused member cannot capture net worth through the privileged RPC'
);

reset role;
select * from finish();
rollback;
