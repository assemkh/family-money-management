create type public.category_type as enum (
  'essentials',
  'personal',
  'savings',
  'investment',
  'reserve',
  'liability',
  'other'
);

create type public.account_type as enum (
  'cash',
  'bank',
  'postal',
  'foreign_currency',
  'digital_wallet',
  'other'
);

create type public.asset_type as enum ('gold', 'investment', 'other');
create type public.plan_status as enum ('draft', 'active', 'closed');
create type public.transaction_type as enum (
  'income',
  'expense',
  'saving',
  'investment',
  'transfer',
  'adjustment',
  'debt_payment'
);
create type public.recurring_frequency as enum ('weekly', 'monthly', 'yearly', 'custom');
create type public.liability_status as enum ('active', 'paid', 'closed');
create type public.savings_goal_status as enum ('active', 'paused', 'completed', 'cancelled');

alter table public.profiles
  add constraint profiles_family_id_id_key unique (family_id, id);

create table public.income_sources (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  owner_member_id uuid,
  name text not null check (char_length(trim(name)) between 1 and 100),
  is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint income_sources_family_id_id_key unique (family_id, id),
  constraint income_sources_family_name_key unique (family_id, name),
  constraint income_sources_family_owner_fk
    foreign key (family_id, owner_member_id)
    references public.profiles (family_id, id)
    on delete set null (owner_member_id)
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  type public.account_type not null,
  currency text not null default 'DZD' check (currency in ('DZD', 'EUR', 'USD')),
  current_balance numeric(20, 2) not null default 0,
  is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accounts_family_id_id_key unique (family_id, id),
  constraint accounts_family_name_key unique (family_id, name)
);

create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families (id) on delete cascade,
  parent_category_id uuid,
  name text not null check (char_length(trim(name)) between 1 and 100),
  type public.category_type not null,
  is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expense_categories_family_id_id_key unique (family_id, id),
  constraint expense_categories_family_parent_fk
    foreign key (family_id, parent_category_id)
    references public.expense_categories (family_id, id)
    on delete restrict
);

create unique index expense_categories_family_name_type_key
  on public.expense_categories (family_id, lower(name), type)
  where family_id is not null;
create unique index expense_categories_system_name_type_key
  on public.expense_categories (lower(name), type)
  where family_id is null;

create table public.income_entries (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  member_id uuid not null,
  source_id uuid not null,
  income_month date not null check (income_month = date_trunc('month', income_month)::date),
  amount numeric(20, 2) not null check (amount > 0),
  currency text not null default 'DZD' check (currency in ('DZD', 'EUR', 'USD')),
  note text check (note is null or char_length(note) <= 2000),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (family_id, member_id) references public.profiles (family_id, id),
  foreign key (family_id, source_id) references public.income_sources (family_id, id)
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  asset_type public.asset_type not null,
  name text not null check (char_length(trim(name)) between 1 and 100),
  purchase_value numeric(20, 2) not null default 0 check (purchase_value >= 0),
  current_value numeric(20, 2) not null default 0 check (current_value >= 0),
  currency text not null default 'DZD' check (currency in ('DZD', 'EUR', 'USD')),
  purchase_date date,
  notes text check (notes is null or char_length(notes) <= 2000),
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.investments (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  type text not null check (char_length(trim(type)) between 1 and 60),
  purchase_cost numeric(20, 2) not null default 0 check (purchase_cost >= 0),
  current_value numeric(20, 2) not null default 0 check (current_value >= 0),
  currency text not null default 'DZD' check (currency in ('DZD', 'EUR', 'USD')),
  purchase_date date,
  notes text check (notes is null or char_length(notes) <= 2000),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  target_amount numeric(20, 2) not null check (target_amount > 0),
  current_amount numeric(20, 2) not null default 0 check (current_amount >= 0),
  currency text not null default 'DZD' check (currency in ('DZD', 'EUR', 'USD')),
  target_date date,
  priority smallint not null default 3 check (priority between 1 and 5),
  status public.savings_goal_status not null default 'active',
  notes text check (notes is null or char_length(notes) <= 2000),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.monthly_plans (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  month_key date not null check (month_key = date_trunc('month', month_key)::date),
  status public.plan_status not null default 'draft',
  current_version_id uuid,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_plans_family_month_key unique (family_id, month_key),
  constraint monthly_plans_id_family_key unique (id, family_id)
);

create table public.monthly_plan_versions (
  id uuid primary key default gen_random_uuid(),
  monthly_plan_id uuid not null references public.monthly_plans (id) on delete cascade,
  family_id uuid not null references public.families (id) on delete cascade,
  version_number integer not null check (version_number > 0),
  reason text not null check (char_length(trim(reason)) between 1 and 500),
  essentials_percent numeric(5, 2) not null check (essentials_percent >= 0),
  personal_percent numeric(5, 2) not null check (personal_percent >= 0),
  savings_percent numeric(5, 2) not null check (savings_percent >= 0),
  investment_percent numeric(5, 2) not null check (investment_percent >= 0),
  reserve_percent numeric(5, 2) not null check (reserve_percent >= 0),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint monthly_plan_versions_plan_version_key unique (monthly_plan_id, version_number),
  constraint monthly_plan_versions_id_plan_key unique (id, monthly_plan_id),
  constraint monthly_plan_versions_family_plan_fk
    foreign key (monthly_plan_id, family_id)
    references public.monthly_plans (id, family_id)
    on delete cascade,
  constraint monthly_plan_versions_total_check check (
    essentials_percent + personal_percent + savings_percent +
    investment_percent + reserve_percent = 100.00
  )
);

alter table public.monthly_plans
  add constraint monthly_plans_current_version_fk
  foreign key (current_version_id, id)
  references public.monthly_plan_versions (id, monthly_plan_id)
  deferrable initially deferred;

create table public.expense_entries (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  member_id uuid not null,
  transaction_date date not null,
  month_key date generated always as (
    transaction_date - (extract(day from transaction_date)::integer - 1)
  ) stored,
  main_category public.category_type not null,
  subcategory_id uuid,
  amount numeric(20, 2) not null check (amount > 0),
  currency text not null default 'DZD' check (currency in ('DZD', 'EUR', 'USD')),
  payment_account_id uuid,
  note text check (note is null or char_length(note) <= 2000),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (family_id, member_id) references public.profiles (family_id, id),
  foreign key (family_id, subcategory_id)
    references public.expense_categories (family_id, id),
  foreign key (family_id, payment_account_id)
    references public.accounts (family_id, id)
);

create table public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  member_id uuid not null,
  transaction_date date not null,
  month_key date generated always as (
    transaction_date - (extract(day from transaction_date)::integer - 1)
  ) stored,
  type public.transaction_type not null,
  amount numeric(20, 2) not null check (amount > 0),
  currency text not null default 'DZD' check (currency in ('DZD', 'EUR', 'USD')),
  source_table text check (source_table is null or char_length(source_table) <= 80),
  source_id uuid,
  note text check (note is null or char_length(note) <= 2000),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (family_id, member_id) references public.profiles (family_id, id)
);

create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  transfer_date date not null,
  from_account_id uuid not null,
  to_account_id uuid not null,
  amount numeric(20, 2) not null check (amount > 0),
  currency text not null default 'DZD' check (currency in ('DZD', 'EUR', 'USD')),
  note text check (note is null or char_length(note) <= 2000),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint transfers_different_accounts_check check (from_account_id <> to_account_id),
  foreign key (family_id, from_account_id) references public.accounts (family_id, id),
  foreign key (family_id, to_account_id) references public.accounts (family_id, id)
);

create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  type public.transaction_type not null,
  category_id uuid,
  amount numeric(20, 2) not null check (amount > 0),
  currency text not null default 'DZD' check (currency in ('DZD', 'EUR', 'USD')),
  frequency public.recurring_frequency not null,
  custom_interval_days integer check (
    (frequency = 'custom' and custom_interval_days > 0)
    or (frequency <> 'custom' and custom_interval_days is null)
  ),
  next_due_date date not null,
  active boolean not null default true,
  notes text check (notes is null or char_length(notes) <= 2000),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (family_id, category_id)
    references public.expense_categories (family_id, id)
);

create table public.liabilities (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  type text not null check (char_length(trim(type)) between 1 and 60),
  original_amount numeric(20, 2) not null check (original_amount > 0),
  paid_amount numeric(20, 2) not null default 0
    check (paid_amount >= 0 and paid_amount <= original_amount),
  currency text not null default 'DZD' check (currency in ('DZD', 'EUR', 'USD')),
  due_date date,
  monthly_payment numeric(20, 2) check (monthly_payment is null or monthly_payment > 0),
  status public.liability_status not null default 'active',
  notes text check (notes is null or char_length(notes) <= 2000),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  currency text not null check (currency in ('EUR', 'USD')),
  rate_to_base numeric(20, 6) not null check (rate_to_base > 0),
  effective_date date not null default current_date,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exchange_rates_family_currency_date_key
    unique (family_id, currency, effective_date)
);

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  key text not null check (key ~ '^[a-z][a-z0-9_.-]{1,63}$'),
  value jsonb not null,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint settings_family_key unique (family_id, key)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  family_id uuid not null references public.families (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  entity_type text not null,
  entity_id text not null,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create index income_entries_family_month_idx on public.income_entries (family_id, income_month);
create index expense_entries_family_month_idx on public.expense_entries (family_id, month_key);
create index expense_entries_family_date_idx on public.expense_entries (family_id, transaction_date desc);
create index expense_entries_category_idx on public.expense_entries (subcategory_id);
create index financial_transactions_family_month_idx
  on public.financial_transactions (family_id, month_key, type);
create index transfers_family_date_idx on public.transfers (family_id, transfer_date desc);
create index recurring_transactions_due_idx
  on public.recurring_transactions (family_id, active, next_due_date);
create index liabilities_family_status_idx on public.liabilities (family_id, status);
create index exchange_rates_lookup_idx
  on public.exchange_rates (family_id, currency, effective_date desc);
create index audit_logs_family_created_idx
  on public.audit_logs (family_id, created_at desc);

create function private.set_row_metadata()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if actor_id is not null then
      new.created_by := actor_id;
      new.updated_by := actor_id;
    end if;
    new.created_at := coalesce(new.created_at, now());
    new.updated_at := coalesce(new.updated_at, now());
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    if actor_id is not null then
      new.updated_by := actor_id;
    end if;
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create function private.prevent_plan_version_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Monthly plan versions are immutable';
end;
$$;

create function private.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  record_family_id uuid;
  record_id text;
begin
  record_family_id := case when tg_op = 'DELETE' then old.family_id else new.family_id end;
  record_id := case when tg_op = 'DELETE' then old.id::text else new.id::text end;

  if record_family_id is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  insert into public.audit_logs (
    family_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  ) values (
    record_family_id,
    auth.uid(),
    tg_op,
    tg_table_name,
    record_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create function private.set_created_actor()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

revoke all on function private.set_row_metadata() from public;
revoke all on function private.prevent_plan_version_mutation() from public;
revoke all on function private.audit_row_change() from public;
revoke all on function private.set_created_actor() from public;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'income_sources', 'accounts', 'expense_categories', 'income_entries',
    'assets', 'investments', 'savings_goals', 'monthly_plans',
    'expense_entries', 'financial_transactions', 'recurring_transactions',
    'liabilities', 'exchange_rates', 'settings'
  ]
  loop
    execute format(
      'create trigger %I before insert or update on public.%I for each row execute function private.set_row_metadata()',
      table_name || '_set_row_metadata',
      table_name
    );
  end loop;
end;
$$;

create trigger monthly_plan_versions_immutable
before update or delete on public.monthly_plan_versions
for each row execute function private.prevent_plan_version_mutation();

create trigger transfers_set_created_actor
before insert on public.transfers
for each row execute function private.set_created_actor();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'accounts', 'assets', 'liabilities', 'expense_categories',
    'monthly_plans', 'monthly_plan_versions', 'settings'
  ]
  loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function private.audit_row_change()',
      table_name || '_audit_change',
      table_name
    );
  end loop;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'income_sources', 'accounts', 'expense_categories', 'income_entries',
    'expense_entries', 'assets', 'investments', 'savings_goals',
    'monthly_plans', 'monthly_plan_versions', 'financial_transactions',
    'transfers', 'recurring_transactions', 'liabilities', 'exchange_rates',
    'settings', 'audit_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant all on table public.%I to service_role', table_name);
  end loop;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'income_entries', 'expense_entries', 'accounts', 'assets', 'investments',
    'savings_goals', 'monthly_plans', 'financial_transactions', 'transfers',
    'recurring_transactions', 'liabilities', 'exchange_rates'
  ]
  loop
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);
    execute format(
      'create policy "Family members can read %1$s" on public.%1$I for select to authenticated using (family_id = (select private.current_family_id()))',
      table_name
    );
    execute format(
      'create policy "Family members can insert %1$s" on public.%1$I for insert to authenticated with check (family_id = (select private.current_family_id()))',
      table_name
    );
    execute format(
      'create policy "Family members can update %1$s" on public.%1$I for update to authenticated using (family_id = (select private.current_family_id())) with check (family_id = (select private.current_family_id()))',
      table_name
    );
    execute format(
      'create policy "Family members can delete %1$s" on public.%1$I for delete to authenticated using (family_id = (select private.current_family_id()))',
      table_name
    );
  end loop;
end;
$$;

grant select, insert on table public.monthly_plan_versions to authenticated;
create policy "Family members can read monthly plan versions"
on public.monthly_plan_versions for select to authenticated
using (family_id = (select private.current_family_id()));
create policy "Family members can create monthly plan versions"
on public.monthly_plan_versions for insert to authenticated
with check (
  family_id = (select private.current_family_id())
  and created_by = (select auth.uid())
);

grant select on table public.expense_categories to authenticated;
grant insert, update, delete on table public.expense_categories to authenticated;
create policy "Family members can read available categories"
on public.expense_categories for select to authenticated
using (family_id is null or family_id = (select private.current_family_id()));
create policy "Owners can create family categories"
on public.expense_categories for insert to authenticated
with check (
  family_id = (select private.current_family_id())
  and (select private.is_family_owner(family_id))
);
create policy "Owners can update family categories"
on public.expense_categories for update to authenticated
using (
  family_id = (select private.current_family_id())
  and (select private.is_family_owner(family_id))
)
with check (
  family_id = (select private.current_family_id())
  and (select private.is_family_owner(family_id))
);
create policy "Owners can delete unused family categories"
on public.expense_categories for delete to authenticated
using (
  family_id = (select private.current_family_id())
  and (select private.is_family_owner(family_id))
);

grant select, insert, update, delete on table public.income_sources to authenticated;
create policy "Family members can read income sources"
on public.income_sources for select to authenticated
using (family_id = (select private.current_family_id()));
create policy "Owners can create income sources"
on public.income_sources for insert to authenticated
with check (
  family_id = (select private.current_family_id())
  and (select private.is_family_owner(family_id))
);
create policy "Owners can update income sources"
on public.income_sources for update to authenticated
using (
  family_id = (select private.current_family_id())
  and (select private.is_family_owner(family_id))
)
with check (
  family_id = (select private.current_family_id())
  and (select private.is_family_owner(family_id))
);
create policy "Owners can delete unused income sources"
on public.income_sources for delete to authenticated
using (
  family_id = (select private.current_family_id())
  and (select private.is_family_owner(family_id))
);

grant select, insert, update, delete on table public.settings to authenticated;
create policy "Family members can read settings"
on public.settings for select to authenticated
using (family_id = (select private.current_family_id()));
create policy "Owners can create settings"
on public.settings for insert to authenticated
with check (
  family_id = (select private.current_family_id())
  and (select private.is_family_owner(family_id))
);
create policy "Owners can update settings"
on public.settings for update to authenticated
using (
  family_id = (select private.current_family_id())
  and (select private.is_family_owner(family_id))
)
with check (
  family_id = (select private.current_family_id())
  and (select private.is_family_owner(family_id))
);
create policy "Owners can delete settings"
on public.settings for delete to authenticated
using (
  family_id = (select private.current_family_id())
  and (select private.is_family_owner(family_id))
);

grant select on table public.audit_logs to authenticated;
grant usage, select on sequence public.audit_logs_id_seq to authenticated;
create policy "Owners can read family audit logs"
on public.audit_logs for select to authenticated
using (
  family_id = (select private.current_family_id())
  and (select private.is_family_owner(family_id))
);

insert into public.expense_categories (family_id, name, type, sort_order)
values
  (null, 'Housing', 'essentials', 10),
  (null, 'Food & Groceries', 'essentials', 20),
  (null, 'Electricity', 'essentials', 30),
  (null, 'Gas', 'essentials', 40),
  (null, 'Water', 'essentials', 50),
  (null, 'Internet', 'essentials', 60),
  (null, 'Phone', 'essentials', 70),
  (null, 'Transport', 'essentials', 80),
  (null, 'Fuel', 'essentials', 90),
  (null, 'Health', 'essentials', 100),
  (null, 'Essential Clothing', 'essentials', 110),
  (null, 'Household Supplies', 'essentials', 120),
  (null, 'Wedding Expenses', 'essentials', 130),
  (null, 'Other', 'essentials', 140),
  (null, 'Assem', 'personal', 10),
  (null, 'Wife', 'personal', 20),
  (null, 'Entertainment', 'personal', 30),
  (null, 'Hobbies', 'personal', 40),
  (null, 'Restaurants', 'personal', 50),
  (null, 'Games', 'personal', 60),
  (null, 'Personal Subscriptions', 'personal', 70),
  (null, 'Personal Clothing', 'personal', 80),
  (null, 'Gifts', 'personal', 90),
  (null, 'Other', 'personal', 100),
  (null, 'Emergency Fund', 'savings', 10),
  (null, 'Wedding', 'savings', 20),
  (null, 'Travel', 'savings', 30),
  (null, 'Car', 'savings', 40),
  (null, 'Home', 'savings', 50),
  (null, 'Other Goal', 'savings', 60),
  (null, 'Investment 1', 'investment', 10),
  (null, 'Investment 2', 'investment', 20),
  (null, 'Gold', 'investment', 30),
  (null, 'Other Asset', 'investment', 40),
  (null, 'Loan', 'liability', 10),
  (null, 'Personal Debt', 'liability', 20),
  (null, 'Installment', 'liability', 30),
  (null, 'Other Obligation', 'liability', 40);

comment on table public.monthly_plan_versions is
  'Immutable revisions; a monthly plan points to its current approved version.';
comment on table public.financial_transactions is
  'Normalized reporting ledger. Transfers remain a distinct non-consumption type.';
comment on table public.audit_logs is
  'Append-only audit history written by trusted database triggers.';
