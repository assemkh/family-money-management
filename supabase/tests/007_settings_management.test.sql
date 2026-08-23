begin;

create extension if not exists pgtap with schema extensions;

select plan(5);

insert into auth.users (id, email)
values
  ('31000000-0000-0000-0000-000000000001', 'settings-owner@example.test'),
  ('31000000-0000-0000-0000-000000000002', 'settings-member@example.test'),
  ('32000000-0000-0000-0000-000000000001', 'other-owner@example.test');

insert into public.families (id, name)
values
  ('c1000000-0000-0000-0000-000000000001', 'Settings Family'),
  ('c2000000-0000-0000-0000-000000000001', 'Other Family');

insert into public.profiles (id, family_id, display_name, username, role)
values
  (
    '31000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'Settings Owner',
    'settings_owner',
    'owner'
  ),
  (
    '31000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000001',
    'Settings Member',
    'settings_member',
    'member'
  ),
  (
    '32000000-0000-0000-0000-000000000001',
    'c2000000-0000-0000-0000-000000000001',
    'Other Owner',
    'other_settings_owner',
    'owner'
  );

insert into public.settings (family_id, key, value)
values (
  'c2000000-0000-0000-0000-000000000001',
  'allocation.defaults',
  '{"essentials": 100}'::jsonb
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '31000000-0000-0000-0000-000000000001',
  true
);

select lives_ok(
  $$
    insert into public.settings (family_id, key, value)
    values (
      'c1000000-0000-0000-0000-000000000001',
      'allocation.defaults',
      '{"essentials": 50, "personal": 10, "savings": 20, "investment": 15, "reserve": 5}'::jsonb
    )
  $$,
  'the owner can create a family setting'
);

select lives_ok(
  $$
    insert into public.settings (family_id, key, value)
    values (
      'c1000000-0000-0000-0000-000000000001',
      'allocation.defaults',
      '{"essentials": 45, "personal": 10, "savings": 25, "investment": 15, "reserve": 5}'::jsonb
    )
    on conflict (family_id, key)
    do update set value = excluded.value
  $$,
  'the owner can update a setting through the application upsert path'
);

select results_eq(
  $$
    select value ->> 'essentials'
    from public.settings
    where key = 'allocation.defaults'
  $$,
  array['45'::text],
  'the owner reads the saved family-scoped value'
);

select results_eq(
  $$
    select count(*)
    from public.audit_logs
    where entity_type = 'settings'
      and family_id = 'c1000000-0000-0000-0000-000000000001'
  $$,
  array[2::bigint],
  'settings inserts and updates are audited'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '31000000-0000-0000-0000-000000000002',
  true
);

select is_empty(
  $$
    update public.settings
    set value = '{"essentials": 0}'::jsonb
    where key = 'allocation.defaults'
    returning id
  $$,
  'a member cannot modify owner-managed settings'
);

reset role;
select * from finish();
rollback;
