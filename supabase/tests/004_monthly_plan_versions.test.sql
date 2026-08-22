begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

insert into auth.users (id, email)
values ('10000000-0000-0000-0000-000000000001', 'planner@example.test');

insert into public.families (id, name)
values ('a0000000-0000-0000-0000-000000000001', 'Planning Family');

insert into public.profiles (id, family_id, display_name, username, role)
values (
  '10000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Planner',
  'planner',
  'owner'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select ok(
  has_function_privilege(
    'authenticated',
    'public.save_monthly_plan(date,text,numeric,numeric,numeric,numeric,numeric)',
    'execute'
  ),
  'authenticated family members can call the atomic plan operation'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.save_monthly_plan(date,text,numeric,numeric,numeric,numeric,numeric)',
    'execute'
  ),
  'anonymous callers cannot save monthly plans'
);

select ok(
  not has_table_privilege('authenticated', 'public.monthly_plans', 'insert'),
  'direct plan inserts cannot bypass atomic versioning'
);

select ok(
  not has_table_privilege('authenticated', 'public.monthly_plan_versions', 'insert'),
  'direct version inserts cannot bypass current-version updates'
);

select lives_ok(
  $$select public.save_monthly_plan('2026-09-01', 'Initial September plan', 50, 10, 20, 15, 5)$$,
  'a valid 100 percent plan is activated'
);

select results_eq(
  $$select status::text from public.monthly_plans where month_key = '2026-09-01'$$,
  array['active'::text],
  'the valid plan becomes active'
);

select results_eq(
  $$select version_number from public.monthly_plan_versions where reason = 'Initial September plan'$$,
  array[1],
  'the first plan creates version one'
);

select results_eq(
  $$
    select version.id
    from public.monthly_plans as plan_row
    join public.monthly_plan_versions as version on version.id = plan_row.current_version_id
    where plan_row.month_key = '2026-09-01'
  $$,
  $$select id from public.monthly_plan_versions where reason = 'Initial September plan'$$,
  'the plan points to its first version'
);

select lives_ok(
  $$select public.save_monthly_plan('2026-09-01', 'Increase savings after salary review', 48, 10, 22, 15, 5)$$,
  'revising a plan creates a new immutable version'
);

select results_eq(
  $$select version_number from public.monthly_plan_versions order by version_number$$,
  array[1, 2],
  'the previous version remains in history'
);

select results_eq(
  $$
    select version.reason
    from public.monthly_plans as plan_row
    join public.monthly_plan_versions as version on version.id = plan_row.current_version_id
    where plan_row.month_key = '2026-09-01'
  $$,
  array['Increase savings after salary review'::text],
  'the active pointer advances to the newest version'
);

select throws_ok(
  $$select public.save_monthly_plan('2026-10-01', 'Invalid total', 60, 10, 20, 15, 5)$$,
  '22023',
  'Monthly allocation must total exactly 100 percent',
  'an invalid total cannot be activated'
);

reset role;
select * from finish();
rollback;
