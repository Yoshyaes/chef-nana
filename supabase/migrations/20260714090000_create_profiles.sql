-- Profiles table for multi-user auth (Phase 1 of tasks-and-multiuser).
-- Apply this in the Supabase SQL editor or via supabase db push.

create table public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  full_name     text        not null,
  role          text        not null check (role in ('admin', 'manager', 'owner')),
  avatar_color  text        not null default '#C9973A',
  created_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Membership check functions. security definer so the internal lookup against
-- profiles bypasses RLS instead of re-triggering the policy that calls it.
-- A select policy on profiles that queries profiles from inside its own
-- using clause causes Postgres to reject it with "infinite recursion
-- detected in policy for relation profiles". Routing the check through a
-- security definer function avoids that, while keeping the same access rule.
create or replace function public.is_team_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

grant execute on function public.is_team_member() to authenticated;
grant execute on function public.is_admin() to authenticated;

create policy "members read profiles"
  on public.profiles
  for select
  to authenticated
  using (public.is_team_member());

create policy "admin manages profiles"
  on public.profiles
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Bootstrap note: the very first profile row (Fred's) must be inserted with
-- the service role, since "members read profiles" requires an existing
-- profile row to pass. See supabase/seed/seed_admin_profiles.sql.
