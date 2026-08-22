-- Keep balance-changing operations atomic and prevent authenticated clients from
-- bypassing the account ledger rules with direct Data API writes.

revoke insert, update, delete on table public.transfers from authenticated;
revoke insert, update, delete on table public.expense_entries from authenticated;
revoke update on table public.accounts from authenticated;
grant update (name, type, currency, is_active, sort_order, updated_at)
  on table public.accounts to authenticated;

create function private.record_expense(
  p_category_id uuid,
  p_transaction_date date,
  p_amount numeric,
  p_currency text,
  p_payment_account_id uuid default null,
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
  category_type public.category_type;
  account_currency text;
  account_balance numeric(20, 2);
  new_expense_id uuid;
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

  if p_amount is null or p_amount <= 0 then
    raise exception using errcode = '22023', message = 'Amount must be greater than zero';
  end if;

  if p_currency not in ('DZD', 'EUR', 'USD') then
    raise exception using errcode = '22023', message = 'Unsupported currency';
  end if;

  select category.type
  into category_type
  from public.expense_categories as category
  where category.id = p_category_id
    and category.family_id = actor_family_id
    and category.is_active;

  if category_type is null then
    raise exception using errcode = '22023', message = 'Invalid family category';
  end if;

  if p_payment_account_id is not null then
    select account.currency, account.current_balance
    into account_currency, account_balance
    from public.accounts as account
    where account.id = p_payment_account_id
      and account.family_id = actor_family_id
      and account.is_active
    for update;

    if account_currency is null then
      raise exception using errcode = '22023', message = 'Invalid family account';
    end if;

    if account_currency <> p_currency then
      raise exception using errcode = '22023', message = 'Account and expense currencies must match';
    end if;

    if account_balance < p_amount then
      raise exception using errcode = '22023', message = 'Insufficient account balance';
    end if;

    update public.accounts
    set current_balance = current_balance - p_amount
    where id = p_payment_account_id
      and family_id = actor_family_id;
  end if;

  insert into public.expense_entries (
    family_id,
    member_id,
    transaction_date,
    main_category,
    subcategory_id,
    amount,
    currency,
    payment_account_id,
    note
  )
  values (
    actor_family_id,
    actor_id,
    p_transaction_date,
    category_type,
    p_category_id,
    p_amount,
    p_currency,
    p_payment_account_id,
    nullif(trim(p_note), '')
  )
  returning id into new_expense_id;

  return new_expense_id;
end;
$$;

create function public.record_expense(
  p_category_id uuid,
  p_transaction_date date,
  p_amount numeric,
  p_currency text,
  p_payment_account_id uuid default null,
  p_note text default null
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.record_expense(
    p_category_id,
    p_transaction_date,
    p_amount,
    p_currency,
    p_payment_account_id,
    p_note
  )
$$;

create function private.set_account_balance(
  p_account_id uuid,
  p_balance numeric
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_family_id uuid;
  updated_account_id uuid;
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

  if p_balance is null or p_balance < 0 then
    raise exception using errcode = '22023', message = 'Balance cannot be negative';
  end if;

  update public.accounts
  set current_balance = p_balance
  where id = p_account_id
    and family_id = actor_family_id
    and is_active
  returning id into updated_account_id;

  if updated_account_id is null then
    raise exception using errcode = '22023', message = 'Invalid family account';
  end if;

  return updated_account_id;
end;
$$;

create function public.set_account_balance(
  p_account_id uuid,
  p_balance numeric
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.set_account_balance(p_account_id, p_balance)
$$;

create function private.record_transfer(
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_transfer_date date,
  p_amount numeric,
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
  from_currency text;
  to_currency text;
  from_balance numeric(20, 2);
  matching_account_count integer;
  new_transfer_id uuid;
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

  if p_from_account_id = p_to_account_id then
    raise exception using errcode = '22023', message = 'Transfer accounts must be different';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception using errcode = '22023', message = 'Amount must be greater than zero';
  end if;

  -- Lock in a stable order to avoid deadlocks when simultaneous transfers run
  -- in opposite directions.
  perform account.id
  from public.accounts as account
  where account.family_id = actor_family_id
    and account.is_active
    and account.id in (p_from_account_id, p_to_account_id)
  order by account.id
  for update;

  select count(*)
  into matching_account_count
  from public.accounts as account
  where account.family_id = actor_family_id
    and account.is_active
    and account.id in (p_from_account_id, p_to_account_id);

  if matching_account_count <> 2 then
    raise exception using errcode = '22023', message = 'Invalid family account';
  end if;

  select account.currency, account.current_balance
  into from_currency, from_balance
  from public.accounts as account
  where account.id = p_from_account_id
    and account.family_id = actor_family_id;

  select account.currency
  into to_currency
  from public.accounts as account
  where account.id = p_to_account_id
    and account.family_id = actor_family_id;

  if from_currency <> to_currency then
    raise exception using errcode = '22023', message = 'Cross-currency transfers require a conversion workflow';
  end if;

  if from_balance < p_amount then
    raise exception using errcode = '22023', message = 'Insufficient account balance';
  end if;

  update public.accounts
  set current_balance = current_balance - p_amount
  where id = p_from_account_id
    and family_id = actor_family_id;

  update public.accounts
  set current_balance = current_balance + p_amount
  where id = p_to_account_id
    and family_id = actor_family_id;

  insert into public.transfers (
    family_id,
    transfer_date,
    from_account_id,
    to_account_id,
    amount,
    currency,
    note,
    created_by
  )
  values (
    actor_family_id,
    p_transfer_date,
    p_from_account_id,
    p_to_account_id,
    p_amount,
    from_currency,
    nullif(trim(p_note), ''),
    actor_id
  )
  returning id into new_transfer_id;

  return new_transfer_id;
end;
$$;

create function public.record_transfer(
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_transfer_date date,
  p_amount numeric,
  p_note text default null
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.record_transfer(
    p_from_account_id,
    p_to_account_id,
    p_transfer_date,
    p_amount,
    p_note
  )
$$;

revoke all on function private.record_expense(uuid, date, numeric, text, uuid, text)
  from public, anon;
revoke all on function private.set_account_balance(uuid, numeric)
  from public, anon;
revoke all on function private.record_transfer(uuid, uuid, date, numeric, text)
  from public, anon;
revoke all on function public.record_expense(uuid, date, numeric, text, uuid, text)
  from public, anon;
revoke all on function public.set_account_balance(uuid, numeric)
  from public, anon;
revoke all on function public.record_transfer(uuid, uuid, date, numeric, text)
  from public, anon;

grant execute on function private.record_expense(uuid, date, numeric, text, uuid, text)
  to authenticated, service_role;
grant execute on function private.set_account_balance(uuid, numeric)
  to authenticated, service_role;
grant execute on function private.record_transfer(uuid, uuid, date, numeric, text)
  to authenticated, service_role;
grant execute on function public.record_expense(uuid, date, numeric, text, uuid, text)
  to authenticated, service_role;
grant execute on function public.set_account_balance(uuid, numeric)
  to authenticated, service_role;
grant execute on function public.record_transfer(uuid, uuid, date, numeric, text)
  to authenticated, service_role;

create trigger income_entries_audit_change
after insert or update or delete on public.income_entries
for each row execute function private.audit_row_change();

create trigger expense_entries_audit_change
after insert or update or delete on public.expense_entries
for each row execute function private.audit_row_change();

create trigger transfers_audit_change
after insert or update or delete on public.transfers
for each row execute function private.audit_row_change();

comment on function public.record_expense(uuid, date, numeric, text, uuid, text) is
  'Records a family expense and atomically debits its optional same-currency account.';
comment on function public.set_account_balance(uuid, numeric) is
  'Sets an active family account balance through an audited, family-scoped operation.';
comment on function public.record_transfer(uuid, uuid, date, numeric, text) is
  'Moves same-currency money atomically between two active accounts in one family.';
