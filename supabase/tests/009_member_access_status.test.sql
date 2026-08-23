begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

insert into auth.users (id, email)
values
  ('51000000-0000-4000-8000-000000000001', 'access-owner@example.test'),
  ('51000000-0000-4000-8000-000000000002', 'access-member@example.test');

insert into public.families (id, name)
values ('e1000000-0000-4000-8000-000000000001', 'Access Family');

insert into public.profiles (id, family_id, display_name, username, role)
values
  (
    '51000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001',
    'Access Owner',
    'access_owner',
    'owner'
  ),
  (
    '51000000-0000-4000-8000-000000000002',
    'e1000000-0000-4000-8000-000000000001',
    'Access Member',
    'access_member',
    'member'
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '51000000-0000-4000-8000-000000000002',
  true
);

select results_eq(
  $$select count(*) from public.families$$,
  array[1::bigint],
  'an active member can read their family'
);

select throws_ok(
  $$
    update public.profiles
    set is_active = false
    where id = '51000000-0000-4000-8000-000000000002'
  $$,
  '42501',
  'Only the active family owner can change member access',
  'a member cannot deactivate their own account'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '51000000-0000-4000-8000-000000000001',
  true
);

select lives_ok(
  $$
    update public.profiles
    set is_active = false
    where id = '51000000-0000-4000-8000-000000000002'
  $$,
  'the active owner can deactivate a member'
);

select throws_ok(
  $$
    update public.profiles
    set is_active = false
    where id = '51000000-0000-4000-8000-000000000001'
  $$,
  '42501',
  'The family owner cannot be deactivated',
  'the owner account cannot be deactivated'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '51000000-0000-4000-8000-000000000002',
  true
);

select is_empty(
  $$select id from public.families$$,
  'a deactivated member cannot read their family'
);

select is_empty(
  $$select id from public.profiles$$,
  'a deactivated member cannot read family profiles'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '51000000-0000-4000-8000-000000000001',
  true
);

select lives_ok(
  $$
    update public.profiles
    set is_active = true
    where id = '51000000-0000-4000-8000-000000000002'
  $$,
  'the owner can restore member access'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '51000000-0000-4000-8000-000000000002',
  true
);

select results_eq(
  $$select count(*) from public.families$$,
  array[1::bigint],
  'a restored member can read their family again'
);

reset role;
select * from finish();
rollback;
