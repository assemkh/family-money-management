-- Monthly plans and immutable revisions must be written atomically. Direct Data
-- API writes are removed so callers cannot leave a plan without a current version.

revoke insert, update, delete on table public.monthly_plans from authenticated;
revoke insert on table public.monthly_plan_versions from authenticated;

create function private.save_monthly_plan(
  p_month_key date,
  p_reason text,
  p_essentials_percent numeric,
  p_personal_percent numeric,
  p_savings_percent numeric,
  p_investment_percent numeric,
  p_reserve_percent numeric
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_family_id uuid;
  target_plan_id uuid;
  next_version_number integer;
  new_version_id uuid;
  allocation_total numeric;
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

  if p_month_key is null or p_month_key <> date_trunc('month', p_month_key)::date then
    raise exception using errcode = '22023', message = 'Plan month must be the first day of a month';
  end if;

  if p_reason is null or char_length(trim(p_reason)) not between 1 and 500 then
    raise exception using errcode = '22023', message = 'A revision reason is required';
  end if;

  if p_essentials_percent is null or p_personal_percent is null
    or p_savings_percent is null or p_investment_percent is null
    or p_reserve_percent is null then
    raise exception using errcode = '22023', message = 'Every allocation is required';
  end if;

  if p_essentials_percent < 0 or p_personal_percent < 0
    or p_savings_percent < 0 or p_investment_percent < 0
    or p_reserve_percent < 0 then
    raise exception using errcode = '22023', message = 'Allocations cannot be negative';
  end if;

  allocation_total := p_essentials_percent + p_personal_percent
    + p_savings_percent + p_investment_percent + p_reserve_percent;

  if allocation_total <> 100.00 then
    raise exception using errcode = '22023', message = 'Monthly allocation must total exactly 100 percent';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(actor_family_id::text || ':' || p_month_key::text, 0)
  );

  insert into public.monthly_plans (family_id, month_key, status)
  values (actor_family_id, p_month_key, 'active')
  on conflict (family_id, month_key)
  do update set status = 'active'
  returning id into target_plan_id;

  select coalesce(max(version.version_number), 0) + 1
  into next_version_number
  from public.monthly_plan_versions as version
  where version.monthly_plan_id = target_plan_id;

  insert into public.monthly_plan_versions (
    monthly_plan_id,
    family_id,
    version_number,
    reason,
    essentials_percent,
    personal_percent,
    savings_percent,
    investment_percent,
    reserve_percent,
    created_by
  )
  values (
    target_plan_id,
    actor_family_id,
    next_version_number,
    trim(p_reason),
    p_essentials_percent,
    p_personal_percent,
    p_savings_percent,
    p_investment_percent,
    p_reserve_percent,
    actor_id
  )
  returning id into new_version_id;

  update public.monthly_plans
  set current_version_id = new_version_id,
      status = 'active'
  where id = target_plan_id
    and family_id = actor_family_id;

  return new_version_id;
end;
$$;

create function public.save_monthly_plan(
  p_month_key date,
  p_reason text,
  p_essentials_percent numeric,
  p_personal_percent numeric,
  p_savings_percent numeric,
  p_investment_percent numeric,
  p_reserve_percent numeric
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.save_monthly_plan(
    p_month_key,
    p_reason,
    p_essentials_percent,
    p_personal_percent,
    p_savings_percent,
    p_investment_percent,
    p_reserve_percent
  )
$$;

revoke all on function private.save_monthly_plan(date, text, numeric, numeric, numeric, numeric, numeric)
  from public, anon;
revoke all on function public.save_monthly_plan(date, text, numeric, numeric, numeric, numeric, numeric)
  from public, anon;

grant execute on function private.save_monthly_plan(date, text, numeric, numeric, numeric, numeric, numeric)
  to authenticated, service_role;
grant execute on function public.save_monthly_plan(date, text, numeric, numeric, numeric, numeric, numeric)
  to authenticated, service_role;

comment on function public.save_monthly_plan(date, text, numeric, numeric, numeric, numeric, numeric) is
  'Creates or revises an active family monthly plan as one immutable, atomic version.';
