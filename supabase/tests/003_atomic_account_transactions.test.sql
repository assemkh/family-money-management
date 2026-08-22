begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000001', 'owner-a@example.test'),
  ('20000000-0000-0000-0000-000000000001', 'owner-b@example.test');

insert into public.families (id, name)
values
  ('a0000000-0000-0000-0000-000000000001', 'Family A'),
  ('b0000000-0000-0000-0000-000000000001', 'Family B');

insert into public.profiles (id, family_id, display_name, username, role)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Owner A',
    'owner_a',
    'owner'
  ),
  (
    '20000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Owner B',
    'owner_b',
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
    'CCP',
    'postal',
    'DZD',
    100,
    20
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'EUR',
    'foreign_currency',
    'EUR',
    50,
    30
  ),
  (
    'b1000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Other Cash',
    'cash',
    'DZD',
    1000,
    10
  );

insert into public.expense_categories (id, family_id, name, type)
values (
  'a2000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Food',
  'essentials'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.record_expense(uuid,date,numeric,text,uuid,text)',
    'execute'
  ),
  'authenticated members can call the atomic expense operation'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.record_transfer(uuid,uuid,date,numeric,text)',
    'execute'
  ),
  'authenticated members can call the atomic transfer operation'
);

select ok(
  not has_table_privilege('authenticated', 'public.expense_entries', 'insert'),
  'direct expense inserts cannot bypass balance rules'
);

select ok(
  not has_table_privilege('authenticated', 'public.transfers', 'insert'),
  'direct transfer inserts cannot bypass balance rules'
);

select lives_ok(
  $$select public.record_expense(
    'a2000000-0000-0000-0000-000000000001',
    '2026-08-22',
    250,
    'DZD',
    'a1000000-0000-0000-0000-000000000001',
    'Groceries'
  )$$,
  'expense and account debit commit together'
);

select results_eq(
  $$select current_balance from public.accounts where name = 'Cash'$$,
  array[750::numeric],
  'linked expense debits its payment account'
);

select lives_ok(
  $$select public.record_transfer(
    'a1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    '2026-08-22',
    300,
    'Cash to CCP'
  )$$,
  'same-currency family transfer succeeds'
);

select results_eq(
  $$select current_balance from public.accounts where name = 'Cash'$$,
  array[450::numeric],
  'transfer debits the source account'
);

select results_eq(
  $$select current_balance from public.accounts where name = 'CCP'$$,
  array[400::numeric],
  'transfer credits the destination account'
);

select results_eq(
  $$select count(*) from public.expense_entries where note = 'Cash to CCP'$$,
  array[0::bigint],
  'transfer is never duplicated as consumption spending'
);

select throws_ok(
  $$select public.set_account_balance(
    'b1000000-0000-0000-0000-000000000001',
    1
  )$$,
  '22023',
  'Invalid family account',
  'account balance adjustment cannot cross family boundaries'
);

select throws_ok(
  $$select public.record_transfer(
    'a1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000003',
    '2026-08-22',
    1,
    'Invalid conversion'
  )$$,
  '22023',
  'Cross-currency transfers require a conversion workflow',
  'implicit cross-currency conversion is rejected'
);

select throws_ok(
  $$select public.record_transfer(
    'a1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    '2026-08-22',
    999999,
    'Insufficient funds'
  )$$,
  '22023',
  'Insufficient account balance',
  'a transfer cannot make the source account negative'
);

select cmp_ok(
  (select count(*) from public.audit_logs where entity_type = 'accounts'),
  '>=',
  2::bigint,
  'balance-changing operations are audited'
);

reset role;
select * from finish();
rollback;
