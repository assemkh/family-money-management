begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.families'::regclass),
  'families has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'profiles has RLS enabled'
);

select ok(
  not has_table_privilege('anon', 'public.families', 'select'),
  'anonymous requests cannot read families'
);

select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'role', 'update'),
  'authenticated users cannot directly update profile roles'
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
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select results_eq(
  $$select count(*) from public.families$$,
  array[1::bigint],
  'owner reads exactly their own family'
);

select results_eq(
  $$select count(*) from public.profiles$$,
  array[2::bigint],
  'owner reads profiles from the same family'
);

select results_eq(
  $$
    update public.families
    set name = 'Family A Updated'
    where id = 'a0000000-0000-0000-0000-000000000001'
    returning name
  $$,
  array['Family A Updated'::text],
  'owner updates their own family settings'
);

select is_empty(
  $$
    update public.families
    set name = 'Cross-family attempt'
    where id = 'b0000000-0000-0000-0000-000000000001'
    returning id
  $$,
  'owner cannot update another family'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000002',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);

select is_empty(
  $$
    update public.families
    set name = 'Member attempt'
    where id = 'a0000000-0000-0000-0000-000000000001'
    returning id
  $$,
  'member cannot update owner-only family settings'
);

select results_eq(
  $$
    update public.profiles
    set display_name = 'Member A Updated'
    where id = '10000000-0000-0000-0000-000000000002'
    returning display_name
  $$,
  array['Member A Updated'::text],
  'member updates a permitted field on their own profile'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-0000-0000-000000000001',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select results_eq(
  $$select count(*) from public.profiles$$,
  array[1::bigint],
  'another family cannot read Family A profiles'
);

select is_empty(
  $$
    select id
    from public.families
    where id = 'a0000000-0000-0000-0000-000000000001'
  $$,
  'another family cannot read Family A'
);

reset role;
select * from finish();
rollback;
