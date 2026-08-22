create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
grant usage on schema private to authenticated, service_role;

create type public.member_role as enum ('owner', 'member');

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 100),
  base_currency text not null default 'DZD'
    check (base_currency in ('DZD', 'EUR', 'USD')),
  timezone text not null default 'Africa/Algiers'
    check (char_length(trim(timezone)) between 1 and 100),
  locale text not null default 'en' check (locale in ('en', 'ar')),
  date_format text not null default 'dd/MM/yyyy'
    check (char_length(trim(date_format)) between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  family_id uuid not null references public.families (id) on delete restrict,
  display_name text not null
    check (char_length(trim(display_name)) between 1 and 100),
  username text not null
    check (
      username = lower(username)
      and username ~ '^[a-z0-9][a-z0-9._-]{2,31}$'
    ),
  avatar_url text,
  role public.member_role not null default 'member',
  must_change_password boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_key unique (username),
  constraint profiles_family_username_key unique (family_id, username)
);

create unique index profiles_one_owner_per_family_idx
  on public.profiles (family_id)
  where role = 'owner';

create index profiles_family_id_idx on public.profiles (family_id);

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger families_set_updated_at
before update on public.families
for each row execute function private.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create function private.current_family_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select profile.family_id
  from public.profiles as profile
  where profile.id = (select auth.uid())
  limit 1
$$;

create function private.is_family_owner(target_family_id uuid)
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
    ),
    false
  )
$$;

revoke all on function private.set_updated_at() from public;
revoke all on function private.current_family_id() from public;
revoke all on function private.is_family_owner(uuid) from public;

grant execute on function private.set_updated_at() to authenticated, service_role;
grant execute on function private.current_family_id() to authenticated, service_role;
grant execute on function private.is_family_owner(uuid) to authenticated, service_role;

alter table public.families enable row level security;
alter table public.profiles enable row level security;

revoke all on table public.families from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;

grant select on table public.families to authenticated;
grant update (name, base_currency, timezone, locale, date_format, updated_at)
  on table public.families to authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name, avatar_url, last_login_at, updated_at)
  on table public.profiles to authenticated;

grant all on table public.families to service_role;
grant all on table public.profiles to service_role;

create policy "Family members can read their family"
on public.families
for select
to authenticated
using (id = (select private.current_family_id()));

create policy "Owners can update their family"
on public.families
for update
to authenticated
using (
  id = (select private.current_family_id())
  and (select private.is_family_owner(id))
)
with check (
  id = (select private.current_family_id())
  and (select private.is_family_owner(id))
);

create policy "Family members can read family profiles"
on public.profiles
for select
to authenticated
using (family_id = (select private.current_family_id()));

create policy "Members can update permitted profile fields"
on public.profiles
for update
to authenticated
using (
  family_id = (select private.current_family_id())
  and (
    id = (select auth.uid())
    or (select private.is_family_owner(family_id))
  )
)
with check (
  family_id = (select private.current_family_id())
  and (
    id = (select auth.uid())
    or (select private.is_family_owner(family_id))
  )
);

comment on table public.families is
  'A private household boundary. Every financial row belongs to one family.';

comment on table public.profiles is
  'Application identity and family membership for a Supabase Auth user.';

comment on function private.current_family_id() is
  'Returns the authenticated user family without exposing cross-family profile rows.';

comment on function private.is_family_owner(uuid) is
  'Checks owner authorization for the authenticated user inside one family.';
