-- Privileged finance RPCs were created before member pausing existed. RLS blocks
-- inactive members from ordinary table access, but SECURITY DEFINER functions
-- also need a database-level guard so a stale access token cannot mutate data.

create function private.require_active_finance_actor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  -- Trusted maintenance and service-role operations do not carry an Auth user.
  if actor_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.profiles as profile
    where profile.id = actor_id
      and profile.is_active
  ) then
    raise exception using
      errcode = '42501',
      message = 'Active family membership required';
  end if;

  return new;
end;
$$;

revoke all on function private.require_active_finance_actor() from public;
grant execute on function private.require_active_finance_actor()
  to authenticated, service_role;

create trigger accounts_require_active_actor
before insert or update on public.accounts
for each row execute function private.require_active_finance_actor();

create trigger income_entries_require_active_actor
before insert or update on public.income_entries
for each row execute function private.require_active_finance_actor();

create trigger assets_require_active_actor
before insert or update on public.assets
for each row execute function private.require_active_finance_actor();

create trigger investments_require_active_actor
before insert or update on public.investments
for each row execute function private.require_active_finance_actor();

create trigger savings_goals_require_active_actor
before insert or update on public.savings_goals
for each row execute function private.require_active_finance_actor();

create trigger monthly_plans_require_active_actor
before insert or update on public.monthly_plans
for each row execute function private.require_active_finance_actor();

create trigger monthly_plan_versions_require_active_actor
before insert or update on public.monthly_plan_versions
for each row execute function private.require_active_finance_actor();

create trigger expense_entries_require_active_actor
before insert or update on public.expense_entries
for each row execute function private.require_active_finance_actor();

create trigger financial_transactions_require_active_actor
before insert or update on public.financial_transactions
for each row execute function private.require_active_finance_actor();

create trigger transfers_require_active_actor
before insert or update on public.transfers
for each row execute function private.require_active_finance_actor();

create trigger recurring_transactions_require_active_actor
before insert or update on public.recurring_transactions
for each row execute function private.require_active_finance_actor();

create trigger liabilities_require_active_actor
before insert or update on public.liabilities
for each row execute function private.require_active_finance_actor();

create trigger exchange_rates_require_active_actor
before insert or update on public.exchange_rates
for each row execute function private.require_active_finance_actor();

create trigger net_worth_snapshots_require_active_actor
before insert or update on public.net_worth_snapshots
for each row execute function private.require_active_finance_actor();

comment on function private.require_active_finance_actor() is
  'Defense-in-depth guard that prevents paused or unknown Auth users from mutating finance tables, including through privileged RPCs.';
