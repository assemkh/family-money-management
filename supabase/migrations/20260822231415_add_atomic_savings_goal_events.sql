-- Savings progress and the reporting ledger must stay in sync. Authenticated
-- clients can read both tables, but all writes go through the narrow functions
-- below so a contribution is one atomic operation.

revoke insert, update, delete on table public.savings_goals from authenticated;
revoke insert, update, delete on table public.financial_transactions from authenticated;

create index financial_transactions_goal_source_idx
  on public.financial_transactions (family_id, source_id, transaction_date desc)
  where source_table = 'savings_goals' and type = 'saving';

create function private.create_savings_goal(
  p_name text,
  p_target_amount numeric,
  p_currency text,
  p_target_date date default null,
  p_priority smallint default 3,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_family_id uuid;
  new_goal_id uuid;
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

  if p_name is null or char_length(trim(p_name)) not between 1 and 100 then
    raise exception using errcode = '22023', message = 'Goal name must be between 1 and 100 characters';
  end if;

  if p_target_amount is null or p_target_amount <= 0 then
    raise exception using errcode = '22023', message = 'Target amount must be greater than zero';
  end if;

  if p_currency not in ('DZD', 'EUR', 'USD') then
    raise exception using errcode = '22023', message = 'Unsupported currency';
  end if;

  if p_priority is null or p_priority not between 1 and 5 then
    raise exception using errcode = '22023', message = 'Priority must be between 1 and 5';
  end if;

  if p_notes is not null and char_length(p_notes) > 2000 then
    raise exception using errcode = '22023', message = 'Goal notes are too long';
  end if;

  insert into public.savings_goals (
    family_id,
    name,
    target_amount,
    currency,
    target_date,
    priority,
    notes,
    status
  )
  values (
    actor_family_id,
    trim(p_name),
    p_target_amount,
    p_currency,
    p_target_date,
    p_priority,
    nullif(trim(p_notes), ''),
    'active'
  )
  returning id into new_goal_id;

  return new_goal_id;
end;
$$;

create function public.create_savings_goal(
  p_name text,
  p_target_amount numeric,
  p_currency text,
  p_target_date date default null,
  p_priority smallint default 3,
  p_notes text default null
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.create_savings_goal(
    p_name,
    p_target_amount,
    p_currency,
    p_target_date,
    p_priority,
    p_notes
  )
$$;

create function private.record_saving_contribution(
  p_transaction_date date,
  p_amount numeric,
  p_currency text,
  p_goal_id uuid default null,
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
  goal_currency text;
  goal_status public.savings_goal_status;
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
    raise exception using errcode = '22023', message = 'Contribution date is required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception using errcode = '22023', message = 'Amount must be greater than zero';
  end if;

  if p_currency not in ('DZD', 'EUR', 'USD') then
    raise exception using errcode = '22023', message = 'Unsupported currency';
  end if;

  if p_note is not null and char_length(p_note) > 2000 then
    raise exception using errcode = '22023', message = 'Contribution note is too long';
  end if;

  if p_goal_id is not null then
    select goal.currency, goal.status
    into goal_currency, goal_status
    from public.savings_goals as goal
    where goal.id = p_goal_id
      and goal.family_id = actor_family_id
    for update;

    if goal_currency is null then
      raise exception using errcode = '22023', message = 'Invalid family savings goal';
    end if;

    if goal_status <> 'active' then
      raise exception using errcode = '22023', message = 'Savings goal is not active';
    end if;

    if goal_currency <> p_currency then
      raise exception using errcode = '22023', message = 'Goal and contribution currencies must match';
    end if;

    update public.savings_goals
    set current_amount = current_amount + p_amount,
        status = case
          when current_amount + p_amount >= target_amount then 'completed'::public.savings_goal_status
          else status
        end
    where id = p_goal_id
      and family_id = actor_family_id;
  end if;

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
    'saving',
    p_amount,
    p_currency,
    case when p_goal_id is null then null else 'savings_goals' end,
    p_goal_id,
    nullif(trim(p_note), '')
  )
  returning id into new_transaction_id;

  return new_transaction_id;
end;
$$;

create function public.record_saving_contribution(
  p_transaction_date date,
  p_amount numeric,
  p_currency text,
  p_goal_id uuid default null,
  p_note text default null
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.record_saving_contribution(
    p_transaction_date,
    p_amount,
    p_currency,
    p_goal_id,
    p_note
  )
$$;

create function private.set_savings_goal_status(
  p_goal_id uuid,
  p_status public.savings_goal_status
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_family_id uuid;
  updated_goal_id uuid;
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

  if p_status not in ('active', 'paused', 'cancelled') then
    raise exception using errcode = '22023', message = 'Goal status change is not allowed';
  end if;

  update public.savings_goals
  set status = case
        when p_status = 'active' and current_amount >= target_amount
          then 'completed'::public.savings_goal_status
        else p_status
      end
  where id = p_goal_id
    and family_id = actor_family_id
  returning id into updated_goal_id;

  if updated_goal_id is null then
    raise exception using errcode = '22023', message = 'Invalid family savings goal';
  end if;

  return updated_goal_id;
end;
$$;

create function public.set_savings_goal_status(
  p_goal_id uuid,
  p_status public.savings_goal_status
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.set_savings_goal_status(p_goal_id, p_status)
$$;

revoke all on function private.create_savings_goal(text, numeric, text, date, smallint, text)
  from public, anon;
revoke all on function private.record_saving_contribution(date, numeric, text, uuid, text)
  from public, anon;
revoke all on function private.set_savings_goal_status(uuid, public.savings_goal_status)
  from public, anon;
revoke all on function public.create_savings_goal(text, numeric, text, date, smallint, text)
  from public, anon;
revoke all on function public.record_saving_contribution(date, numeric, text, uuid, text)
  from public, anon;
revoke all on function public.set_savings_goal_status(uuid, public.savings_goal_status)
  from public, anon;

grant execute on function private.create_savings_goal(text, numeric, text, date, smallint, text)
  to authenticated, service_role;
grant execute on function private.record_saving_contribution(date, numeric, text, uuid, text)
  to authenticated, service_role;
grant execute on function private.set_savings_goal_status(uuid, public.savings_goal_status)
  to authenticated, service_role;
grant execute on function public.create_savings_goal(text, numeric, text, date, smallint, text)
  to authenticated, service_role;
grant execute on function public.record_saving_contribution(date, numeric, text, uuid, text)
  to authenticated, service_role;
grant execute on function public.set_savings_goal_status(uuid, public.savings_goal_status)
  to authenticated, service_role;

comment on function public.record_saving_contribution(date, numeric, text, uuid, text) is
  'Records an explicit savings event and advances optional goal progress atomically.';
