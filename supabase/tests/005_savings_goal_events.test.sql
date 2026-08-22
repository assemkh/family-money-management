begin;

create extension if not exists pgtap with schema extensions;

select plan(24);

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000001', 'saver-a@example.test'),
  ('20000000-0000-0000-0000-000000000001', 'saver-b@example.test');

insert into public.families (id, name)
values
  ('a0000000-0000-0000-0000-000000000001', 'Saving Family A'),
  ('b0000000-0000-0000-0000-000000000001', 'Saving Family B');

insert into public.profiles (id, family_id, display_name, username, role)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Saver A',
    'saver_a',
    'owner'
  ),
  (
    '20000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Saver B',
    'saver_b',
    'owner'
  );

insert into public.savings_goals (
  id,
  family_id,
  name,
  target_amount,
  currency,
  priority
)
values (
  'b5000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'Other family goal',
  1000,
  'DZD',
  3
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select ok(
  has_function_privilege(
    'authenticated',
    'public.create_savings_goal(text,numeric,text,date,smallint,text)',
    'execute'
  ),
  'authenticated family members can create a goal through the API'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.record_saving_contribution(date,numeric,text,uuid,text)',
    'execute'
  ),
  'authenticated family members can record a contribution through the API'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.record_saving_contribution(date,numeric,text,uuid,text)',
    'execute'
  ),
  'anonymous callers cannot record savings'
);

select ok(
  not has_table_privilege('authenticated', 'public.savings_goals', 'insert'),
  'direct goal inserts cannot bypass the goal API'
);

select ok(
  not has_table_privilege('authenticated', 'public.financial_transactions', 'insert'),
  'direct ledger inserts cannot invent savings events'
);

select lives_ok(
  $$select public.create_savings_goal(
    'Emergency fund',
    1000,
    'DZD',
    '2027-01-31',
    1::smallint,
    'First safety target'
  )$$,
  'a valid savings goal is created'
);

select results_eq(
  $$select current_amount from public.savings_goals where name = 'Emergency fund'$$,
  array[0::numeric],
  'a new goal starts at zero progress'
);

select results_eq(
  $$select family_id from public.savings_goals where name = 'Emergency fund'$$,
  array['a0000000-0000-0000-0000-000000000001'::uuid],
  'the goal is assigned to the caller family'
);

select lives_ok(
  $$select public.record_saving_contribution(
    '2026-08-23',
    400,
    'DZD',
    (select id from public.savings_goals where name = 'Emergency fund'),
    'First contribution'
  )$$,
  'a contribution and its goal progress commit together'
);

select results_eq(
  $$select current_amount from public.savings_goals where name = 'Emergency fund'$$,
  array[400::numeric],
  'the contribution advances current goal progress'
);

select results_eq(
  $$
    select type::text || ':' || source_table
    from public.financial_transactions
    where note = 'First contribution'
  $$,
  array['saving:savings_goals'::text],
  'the contribution is an explicit savings ledger event'
);

select results_eq(
  $$select member_id from public.financial_transactions where note = 'First contribution'$$,
  array['10000000-0000-0000-0000-000000000001'::uuid],
  'the event preserves the contributing member'
);

select throws_ok(
  $$select public.record_saving_contribution(
    '2026-08-23',
    10,
    'EUR',
    (select id from public.savings_goals where name = 'Emergency fund'),
    null
  )$$,
  '22023',
  'Goal and contribution currencies must match',
  'a contribution cannot silently convert currencies'
);

select throws_ok(
  $$select public.record_saving_contribution(
    '2026-08-23',
    10,
    'DZD',
    'b5000000-0000-0000-0000-000000000001',
    null
  )$$,
  '22023',
  'Invalid family savings goal',
  'a contribution cannot target another family goal'
);

select lives_ok(
  $$select public.set_savings_goal_status(
    (select id from public.savings_goals where name = 'Emergency fund'),
    'paused'
  )$$,
  'an active goal can be paused'
);

select throws_ok(
  $$select public.record_saving_contribution(
    '2026-08-23',
    10,
    'DZD',
    (select id from public.savings_goals where name = 'Emergency fund'),
    null
  )$$,
  '22023',
  'Savings goal is not active',
  'a paused goal rejects contributions'
);

select lives_ok(
  $$select public.set_savings_goal_status(
    (select id from public.savings_goals where name = 'Emergency fund'),
    'active'
  )$$,
  'a paused goal can be reactivated'
);

select lives_ok(
  $$select public.record_saving_contribution(
    '2026-08-24',
    600,
    'DZD',
    (select id from public.savings_goals where name = 'Emergency fund'),
    'Finish target'
  )$$,
  'a contribution can finish a goal'
);

select results_eq(
  $$select status::text from public.savings_goals where name = 'Emergency fund'$$,
  array['completed'::text],
  'reaching the target completes the goal automatically'
);

select results_eq(
  $$select count(*) from public.financial_transactions where source_table = 'savings_goals'$$,
  array[2::bigint],
  'each successful goal contribution has one ledger event'
);

select lives_ok(
  $$select public.record_saving_contribution(
    '2026-08-25',
    300,
    'DZD',
    null,
    'General savings'
  )$$,
  'savings can be recorded without assigning a goal'
);

select results_eq(
  $$select current_amount from public.savings_goals where name = 'Emergency fund'$$,
  array[1000::numeric],
  'general savings do not change a goal balance'
);

select results_eq(
  $$select sum(amount) from public.financial_transactions where type = 'saving'$$,
  array[1300::numeric],
  'actual savings totals come from successful ledger events'
);

select results_eq(
  $$select count(*) from public.savings_goals where family_id = 'b0000000-0000-0000-0000-000000000001'$$,
  array[0::bigint],
  'RLS hides another family savings goals'
);

reset role;
select * from finish();
rollback;
