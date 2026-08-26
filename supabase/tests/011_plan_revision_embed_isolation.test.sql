begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

-- Phase 2.B replaced an unbounded `monthly_plan_versions` read with a PostgREST embed
-- from `monthly_plans` over the composite `monthly_plans_current_version_fk`. PostgREST
-- compiles that embed to the join asserted below, so these tests prove the new query
-- shape stays Household-scoped for owners, members, non-members, and anonymous callers.

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000101', 'embed.owner@example.test'),
  ('10000000-0000-0000-0000-000000000102', 'embed.member@example.test'),
  ('10000000-0000-0000-0000-000000000103', 'embed.outsider@example.test');

insert into public.families (id, name)
values
  ('a0000000-0000-0000-0000-000000000101', 'Embed Household'),
  ('a0000000-0000-0000-0000-000000000102', 'Other Embed Household');

insert into public.profiles (id, family_id, display_name, username, role)
values
  ('10000000-0000-0000-0000-000000000101', 'a0000000-0000-0000-0000-000000000101', 'Embed Owner', 'embed_owner', 'owner'),
  ('10000000-0000-0000-0000-000000000102', 'a0000000-0000-0000-0000-000000000101', 'Embed Member', 'embed_member', 'member'),
  ('10000000-0000-0000-0000-000000000103', 'a0000000-0000-0000-0000-000000000102', 'Embed Outsider', 'embed_outsider', 'owner');

insert into public.monthly_plans (id, family_id, month_key, status)
values
  ('b0000000-0000-0000-0000-000000000101', 'a0000000-0000-0000-0000-000000000101', '2026-09-01', 'active'),
  ('b0000000-0000-0000-0000-000000000102', 'a0000000-0000-0000-0000-000000000102', '2026-09-01', 'active');

insert into public.monthly_plan_versions (
  id, monthly_plan_id, family_id, version_number, reason,
  essentials_percent, personal_percent, savings_percent, investment_percent, reserve_percent, created_by
)
values
  ('c0000000-0000-0000-0000-000000000101', 'b0000000-0000-0000-0000-000000000101',
   'a0000000-0000-0000-0000-000000000101', 1, 'Household revision', 50, 10, 20, 15, 5,
   '10000000-0000-0000-0000-000000000101'),
  ('c0000000-0000-0000-0000-000000000102', 'b0000000-0000-0000-0000-000000000102',
   'a0000000-0000-0000-0000-000000000102', 1, 'Other household revision', 40, 20, 20, 15, 5,
   '10000000-0000-0000-0000-000000000103');

update public.monthly_plans
set current_version_id = 'c0000000-0000-0000-0000-000000000101'
where id = 'b0000000-0000-0000-0000-000000000101';
update public.monthly_plans
set current_version_id = 'c0000000-0000-0000-0000-000000000102'
where id = 'b0000000-0000-0000-0000-000000000102';

select ok(
  (select count(*) from public.monthly_plan_versions) = 2,
  'both households have a current revision before scoping is applied'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000101', true);

select results_eq(
  $$
    select version.reason
    from public.monthly_plans as plan_row
    join public.monthly_plan_versions as version
      on version.id = plan_row.current_version_id
     and version.monthly_plan_id = plan_row.id
  $$,
  array['Household revision'::text],
  'an owner reading the embed sees only their own current revision'
);

select is(
  (select count(*)::integer from public.monthly_plan_versions),
  1,
  'an owner cannot read another household revision through the embedded table'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000102', true);

select results_eq(
  $$
    select version.reason
    from public.monthly_plans as plan_row
    join public.monthly_plan_versions as version
      on version.id = plan_row.current_version_id
     and version.monthly_plan_id = plan_row.id
  $$,
  array['Household revision'::text],
  'a member reading the embed sees the same household revision as the owner'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000103', true);

select results_eq(
  $$
    select version.reason
    from public.monthly_plans as plan_row
    join public.monthly_plan_versions as version
      on version.id = plan_row.current_version_id
     and version.monthly_plan_id = plan_row.id
  $$,
  array['Other household revision'::text],
  'an unrelated household reads only its own revision through the same shape'
);

select is(
  (select count(*)::integer
   from public.monthly_plans as plan_row
   join public.monthly_plan_versions as version
     on version.id = plan_row.current_version_id
   where plan_row.family_id = 'a0000000-0000-0000-0000-000000000101'),
  0,
  'a non-member cannot reach the other household even by naming its id'
);

reset role;

-- Anonymous callers hold no select grant at all, so the embed is unreachable before
-- RLS is even consulted.
select ok(
  not has_table_privilege('anon', 'public.monthly_plans', 'select'),
  'anonymous callers cannot read plans'
);

select ok(
  not has_table_privilege('anon', 'public.monthly_plan_versions', 'select'),
  'anonymous callers cannot read revisions'
);

select * from finish();
rollback;
