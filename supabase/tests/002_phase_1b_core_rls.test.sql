begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

select results_eq(
  $$
    select count(*)
    from pg_class
    where relnamespace = 'public'::regnamespace
      and relkind = 'r'
      and relrowsecurity
  $$,
  array[20::bigint],
  'every exposed application table has RLS enabled'
);

select results_eq(
  $$select count(*) from public.expense_categories where family_id is null$$,
  array[38::bigint],
  'all system category templates are seeded'
);

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000001', 'owner-a@example.test'),
  ('10000000-0000-0000-0000-000000000002', 'member-a@example.test'),
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
    '10000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Member A',
    'member_a',
    'member'
  ),
  (
    '20000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Owner B',
    'owner_b',
    'owner'
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);

select lives_ok(
  $$
    insert into public.accounts (family_id, name, type, currency)
    values ('a0000000-0000-0000-0000-000000000001', 'Cash', 'cash', 'DZD')
  $$,
  'a family member can create finance data in their own family'
);

select results_eq(
  $$select created_by from public.accounts where name = 'Cash'$$,
  array['10000000-0000-0000-0000-000000000001'::uuid],
  'database metadata attributes a write to the authenticated member'
);

select throws_ok(
  $$
    insert into public.accounts (family_id, name, type, currency)
    values ('b0000000-0000-0000-0000-000000000001', 'Stolen', 'cash', 'DZD')
  $$,
  '42501',
  'new row violates row-level security policy for table "accounts"',
  'a user cannot insert finance data into another family'
);

select is_empty(
  $$select id from public.families where id = 'b0000000-0000-0000-0000-000000000001'$$,
  'a user cannot read another family'
);

select results_eq(
  $$select count(*) from public.audit_logs where entity_type = 'accounts'$$,
  array[1::bigint],
  'high-value account changes are audited'
);

select lives_ok(
  $$select public.save_monthly_plan(
    '2026-08-01',
    'Original plan',
    50,
    10,
    20,
    15,
    5
  )$$,
  'a family member can activate a valid monthly plan'
);

reset role;

select throws_ok(
  $$
    update public.monthly_plan_versions
    set reason = 'Overwritten'
    where reason = 'Original plan'
  $$,
  'P0001',
  'Monthly plan versions are immutable',
  'monthly plan history cannot be overwritten'
);

select throws_ok(
  $$
    insert into public.monthly_plan_versions (
      monthly_plan_id,
      family_id,
      version_number,
      reason,
      essentials_percent,
      personal_percent,
      savings_percent,
      investment_percent,
      reserve_percent,
      created_by
    ) select
      plan_row.id,
      plan_row.family_id,
      2,
      'Invalid plan',
      60,
      10,
      20,
      15,
      5,
      '10000000-0000-0000-0000-000000000001'
    from public.monthly_plans as plan_row
    where plan_row.month_key = '2026-08-01'
  $$,
  '23514',
  null,
  'monthly allocation must total exactly 100 percent'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000002',
  true
);

select results_eq(
  $$select count(*) from public.accounts$$,
  array[1::bigint],
  'members share finance data inside the same family'
);

select throws_ok(
  $$
    insert into public.settings (family_id, key, value)
    values (
      'a0000000-0000-0000-0000-000000000001',
      'security.member_attempt',
      'true'::jsonb
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "settings"',
  'members cannot change owner-only settings'
);

select is_empty(
  $$select id from public.audit_logs$$,
  'members cannot read the owner audit log'
);

reset role;
select * from finish();
rollback;
