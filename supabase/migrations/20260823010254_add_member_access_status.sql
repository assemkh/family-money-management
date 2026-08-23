alter table public.profiles
  add column is_active boolean not null default true;

create or replace function private.current_family_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select profile.family_id
  from public.profiles as profile
  where profile.id = (select auth.uid())
    and profile.is_active
  limit 1
$$;

create or replace function private.is_family_owner(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles as profile
      where profile.id = (select auth.uid())
        and profile.family_id = target_family_id
        and profile.role = 'owner'
        and profile.is_active
    ),
    false
  )
$$;

create function private.protect_profile_access_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_active is distinct from old.is_active then
    if old.role = 'owner' then
      raise exception using
        errcode = '42501',
        message = 'The family owner cannot be deactivated';
    end if;

    if not private.is_family_owner(old.family_id) then
      raise exception using
        errcode = '42501',
        message = 'Only the active family owner can change member access';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.protect_profile_access_status() from public;
grant execute on function private.protect_profile_access_status()
  to authenticated, service_role;

create trigger profiles_protect_access_status
before update on public.profiles
for each row execute function private.protect_profile_access_status();

grant update (is_active) on table public.profiles to authenticated;

comment on column public.profiles.is_active is
  'When false, the member cannot resolve a family through RLS and cannot use the application.';

comment on function private.protect_profile_access_status() is
  'Allows only an active family owner to change a non-owner member access status.';
