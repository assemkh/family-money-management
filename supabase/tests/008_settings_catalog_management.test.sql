begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

insert into auth.users (id, email)
values
  ('41000000-0000-0000-0000-000000000001', 'catalog-owner@example.test'),
  ('41000000-0000-0000-0000-000000000002', 'catalog-member@example.test');

insert into public.families (id, name)
values ('d1000000-0000-0000-0000-000000000001', 'Catalog Family');

insert into public.profiles (id, family_id, display_name, username, role)
values
  (
    '41000000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000001',
    'Catalog Owner',
    'catalog_owner',
    'owner'
  ),
  (
    '41000000-0000-0000-0000-000000000002',
    'd1000000-0000-0000-0000-000000000001',
    'Catalog Member',
    'catalog_member',
    'member'
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '41000000-0000-0000-0000-000000000001',
  true
);

select lives_ok(
  $$
    insert into public.expense_categories (
      id, family_id, name, type, sort_order
    ) values (
      'd2000000-0000-0000-0000-000000000001',
      'd1000000-0000-0000-0000-000000000001',
      'School',
      'essentials',
      10
    )
  $$,
  'the owner can create a family category'
);

select lives_ok(
  $$
    insert into public.income_sources (
      id, family_id, owner_member_id, name, sort_order
    ) values (
      'd3000000-0000-0000-0000-000000000001',
      'd1000000-0000-0000-0000-000000000001',
      '41000000-0000-0000-0000-000000000001',
      'Consulting',
      10
    )
  $$,
  'the owner can create a family income source'
);

select lives_ok(
  $$
    update public.expense_categories
    set is_active = false
    where id = 'd2000000-0000-0000-0000-000000000001'
  $$,
  'the owner can archive a family category'
);

select lives_ok(
  $$
    update public.income_sources
    set is_active = false
    where id = 'd3000000-0000-0000-0000-000000000001'
  $$,
  'the owner can archive a family income source'
);

select results_eq(
  $$
    select count(*)
    from public.expense_categories
    where id = 'd2000000-0000-0000-0000-000000000001'
      and not is_active
  $$,
  array[1::bigint],
  'archiving preserves the category record'
);

select results_eq(
  $$
    select count(*)
    from public.income_sources
    where id = 'd3000000-0000-0000-0000-000000000001'
      and not is_active
  $$,
  array[1::bigint],
  'archiving preserves the income-source record'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '41000000-0000-0000-0000-000000000002',
  true
);

select is_empty(
  $$
    update public.expense_categories
    set name = 'Member edit'
    where id = 'd2000000-0000-0000-0000-000000000001'
    returning id
  $$,
  'a member cannot edit an owner-managed category'
);

select is_empty(
  $$
    update public.income_sources
    set name = 'Member edit'
    where id = 'd3000000-0000-0000-0000-000000000001'
    returning id
  $$,
  'a member cannot edit an owner-managed income source'
);

reset role;
select * from finish();
rollback;
