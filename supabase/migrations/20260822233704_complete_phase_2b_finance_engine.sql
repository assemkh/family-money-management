-- Complete the Phase 2B finance engine with explicit investment events and
-- historical net-worth snapshots. Both write paths are atomic and expose only
-- narrow authenticated functions to the Data API.

create table public.net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  snapshot_month date not null
    check (snapshot_month = date_trunc('month', snapshot_month)::date),
  accounts_dzd numeric(20, 2) not null check (accounts_dzd >= 0),
  assets_dzd numeric(20, 2) not null check (assets_dzd >= 0),
  investments_dzd numeric(20, 2) not null check (investments_dzd >= 0),
  liabilities_dzd numeric(20, 2) not null check (liabilities_dzd >= 0),
  total_assets_dzd numeric(20, 2) not null check (total_assets_dzd >= 0),
  total_liabilities_dzd numeric(20, 2) not null check (total_liabilities_dzd >= 0),
  net_worth_dzd numeric(20, 2) not null,
  rates_snapshot jsonb not null default '{"DZD": 1}'::jsonb,
  captured_by uuid not null references public.profiles (id) on delete restrict,
  captured_at timestamptz not null default now(),
  constraint net_worth_snapshots_family_month_key
    unique (family_id, snapshot_month)
);

create index net_worth_snapshots_family_month_idx
  on public.net_worth_snapshots (family_id, snapshot_month desc);
create index financial_transactions_investment_source_idx
  on public.financial_transactions (family_id, source_id, transaction_date desc)
  where source_table = 'investments' and type = 'investment';

alter table public.net_worth_snapshots enable row level security;
revoke all on table public.net_worth_snapshots from anon, authenticated;
grant all on table public.net_worth_snapshots to service_role;
grant select on table public.net_worth_snapshots to authenticated;

create policy "Family members can read net worth snapshots"
on public.net_worth_snapshots for select to authenticated
using (family_id = (select private.current_family_id()));

create trigger net_worth_snapshots_audit_change
after insert or update or delete on public.net_worth_snapshots
for each row execute function private.audit_row_change();

-- Purchase cost grows only through a real investment event. Manual valuation
-- edits can still update current_value without fabricating invested cash flow.
revoke update on table public.investments from authenticated;
grant update (name, type, current_value, notes, updated_at)
  on table public.investments to authenticated;

create function private.record_investment_event(
  p_investment_id uuid,
  p_transaction_date date,
  p_amount numeric,
  p_currency text,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_family_id uuid;
  investment_currency text;
  new_transaction_id uuid;
begin
  if actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select profile.family_id
  into actor_family_id
  from public.profiles as profile
  where profile.id = actor_id;

  if actor_family_id is null then
    raise exception using errcode = '42501', message = 'Family membership required';
  end if;

  if p_transaction_date is null then
    raise exception using errcode = '22023', message = 'Investment date is required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception using errcode = '22023', message = 'Amount must be greater than zero';
  end if;

  if p_currency not in ('DZD', 'EUR', 'USD') then
    raise exception using errcode = '22023', message = 'Unsupported currency';
  end if;

  if p_note is not null and char_length(p_note) > 2000 then
    raise exception using errcode = '22023', message = 'Investment note is too long';
  end if;

  select investment.currency
  into investment_currency
  from public.investments as investment
  where investment.id = p_investment_id
    and investment.family_id = actor_family_id
  for update;

  if investment_currency is null then
    raise exception using errcode = '22023', message = 'Invalid family investment';
  end if;

  if investment_currency <> p_currency then
    raise exception using errcode = '22023', message = 'Investment and event currencies must match';
  end if;

  update public.investments
  set purchase_cost = purchase_cost + p_amount,
      current_value = current_value + p_amount
  where id = p_investment_id
    and family_id = actor_family_id;

  insert into public.financial_transactions (
    family_id,
    member_id,
    transaction_date,
    type,
    amount,
    currency,
    source_table,
    source_id,
    note
  )
  values (
    actor_family_id,
    actor_id,
    p_transaction_date,
    'investment',
    p_amount,
    p_currency,
    'investments',
    p_investment_id,
    nullif(trim(p_note), '')
  )
  returning id into new_transaction_id;

  return new_transaction_id;
end;
$$;

create function public.record_investment_event(
  p_investment_id uuid,
  p_transaction_date date,
  p_amount numeric,
  p_currency text,
  p_note text default null
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.record_investment_event(
    p_investment_id,
    p_transaction_date,
    p_amount,
    p_currency,
    p_note
  )
$$;

create function private.latest_rate_to_base(
  p_family_id uuid,
  p_currency text
)
returns numeric
language sql
stable
security invoker
set search_path = ''
as $$
  select case
    when p_currency = 'DZD' then 1::numeric
    else (
      select rate.rate_to_base
      from public.exchange_rates as rate
      where rate.family_id = p_family_id
        and rate.currency = p_currency
        and rate.effective_date <= current_date
      order by rate.effective_date desc, rate.created_at desc
      limit 1
    )
  end
$$;

create function private.capture_net_worth_snapshot(p_snapshot_month date)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_family_id uuid;
  family_timezone text;
  current_family_month date;
  missing_currencies text;
  accounts_total numeric(20, 2);
  assets_total numeric(20, 2);
  investments_total numeric(20, 2);
  liabilities_total numeric(20, 2);
  rates_used jsonb;
  snapshot_id uuid;
begin
  if actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select profile.family_id, family.timezone
  into actor_family_id, family_timezone
  from public.profiles as profile
  join public.families as family on family.id = profile.family_id
  where profile.id = actor_id;

  if actor_family_id is null then
    raise exception using errcode = '42501', message = 'Family membership required';
  end if;

  current_family_month := date_trunc(
    'month',
    timezone(coalesce(family_timezone, 'Africa/Algiers'), now())
  )::date;

  if p_snapshot_month is null
    or p_snapshot_month <> date_trunc('month', p_snapshot_month)::date then
    raise exception using errcode = '22023', message = 'Snapshot month must be the first day of a month';
  end if;

  if p_snapshot_month <> current_family_month then
    raise exception using errcode = '22023', message = 'Only the current month can be captured';
  end if;

  select string_agg(distinct valued.currency, ', ' order by valued.currency)
  into missing_currencies
  from (
    select account.currency
    from public.accounts as account
    where account.family_id = actor_family_id
      and account.is_active
      and account.current_balance > 0
    union all
    select asset.currency
    from public.assets as asset
    where asset.family_id = actor_family_id
      and asset.is_active
      and asset.current_value > 0
    union all
    select investment.currency
    from public.investments as investment
    where investment.family_id = actor_family_id
      and investment.current_value > 0
    union all
    select liability.currency
    from public.liabilities as liability
    where liability.family_id = actor_family_id
      and liability.status = 'active'
      and liability.original_amount > liability.paid_amount
  ) as valued
  where valued.currency <> 'DZD'
    and private.latest_rate_to_base(actor_family_id, valued.currency) is null;

  if missing_currencies is not null then
    raise exception using
      errcode = '22023',
      message = 'Missing current exchange rate for: ' || missing_currencies;
  end if;

  select coalesce(sum(
    account.current_balance
    * private.latest_rate_to_base(actor_family_id, account.currency)
  ), 0)
  into accounts_total
  from public.accounts as account
  where account.family_id = actor_family_id
    and account.is_active;

  select coalesce(sum(
    asset.current_value
    * private.latest_rate_to_base(actor_family_id, asset.currency)
  ), 0)
  into assets_total
  from public.assets as asset
  where asset.family_id = actor_family_id
    and asset.is_active;

  select coalesce(sum(
    investment.current_value
    * private.latest_rate_to_base(actor_family_id, investment.currency)
  ), 0)
  into investments_total
  from public.investments as investment
  where investment.family_id = actor_family_id;

  select coalesce(sum(
    (liability.original_amount - liability.paid_amount)
    * private.latest_rate_to_base(actor_family_id, liability.currency)
  ), 0)
  into liabilities_total
  from public.liabilities as liability
  where liability.family_id = actor_family_id
    and liability.status = 'active';

  select jsonb_build_object('DZD', 1)
    || coalesce(jsonb_object_agg(rate.currency, rate.rate_to_base), '{}'::jsonb)
  into rates_used
  from (
    select distinct on (exchange_rate.currency)
      exchange_rate.currency,
      exchange_rate.rate_to_base
    from public.exchange_rates as exchange_rate
    where exchange_rate.family_id = actor_family_id
      and exchange_rate.effective_date <= current_date
    order by
      exchange_rate.currency,
      exchange_rate.effective_date desc,
      exchange_rate.created_at desc
  ) as rate;

  insert into public.net_worth_snapshots (
    family_id,
    snapshot_month,
    accounts_dzd,
    assets_dzd,
    investments_dzd,
    liabilities_dzd,
    total_assets_dzd,
    total_liabilities_dzd,
    net_worth_dzd,
    rates_snapshot,
    captured_by,
    captured_at
  )
  values (
    actor_family_id,
    p_snapshot_month,
    round(accounts_total, 2),
    round(assets_total, 2),
    round(investments_total, 2),
    round(liabilities_total, 2),
    round(accounts_total + assets_total + investments_total, 2),
    round(liabilities_total, 2),
    round(accounts_total + assets_total + investments_total - liabilities_total, 2),
    rates_used,
    actor_id,
    now()
  )
  on conflict (family_id, snapshot_month)
  do update set
    accounts_dzd = excluded.accounts_dzd,
    assets_dzd = excluded.assets_dzd,
    investments_dzd = excluded.investments_dzd,
    liabilities_dzd = excluded.liabilities_dzd,
    total_assets_dzd = excluded.total_assets_dzd,
    total_liabilities_dzd = excluded.total_liabilities_dzd,
    net_worth_dzd = excluded.net_worth_dzd,
    rates_snapshot = excluded.rates_snapshot,
    captured_by = excluded.captured_by,
    captured_at = excluded.captured_at
  returning id into snapshot_id;

  return snapshot_id;
end;
$$;

create function public.capture_net_worth_snapshot(p_snapshot_month date)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.capture_net_worth_snapshot(p_snapshot_month)
$$;

revoke all on function private.record_investment_event(uuid, date, numeric, text, text)
  from public, anon;
revoke all on function public.record_investment_event(uuid, date, numeric, text, text)
  from public, anon;
revoke all on function private.latest_rate_to_base(uuid, text)
  from public, anon, authenticated;
revoke all on function private.capture_net_worth_snapshot(date)
  from public, anon;
revoke all on function public.capture_net_worth_snapshot(date)
  from public, anon;

grant execute on function private.record_investment_event(uuid, date, numeric, text, text)
  to authenticated, service_role;
grant execute on function public.record_investment_event(uuid, date, numeric, text, text)
  to authenticated, service_role;
grant execute on function private.capture_net_worth_snapshot(date)
  to authenticated, service_role;
grant execute on function public.capture_net_worth_snapshot(date)
  to authenticated, service_role;

comment on table public.net_worth_snapshots is
  'One captured DZD valuation per family month; historical rows keep the rates used at capture time.';
comment on function public.record_investment_event(uuid, date, numeric, text, text) is
  'Records invested cash and increases the selected investment position atomically.';
comment on function public.capture_net_worth_snapshot(date) is
  'Captures or refreshes the current family month net worth using current manual exchange rates.';
