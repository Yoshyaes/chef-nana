-- Extend the profiles-membership RLS retrofit to the pre-existing 'tasks'
-- table (the AI-agent action queue that feeds the Today view triage). It was
-- deliberately left out of 20260714090100_retrofit_admin_rls.sql because it
-- is unrelated to the auth work in that migration, but it has no migration
-- history of its own, so its current policy (if any) is unknown and, per the
-- one confirmed contemporaneous policy from that era (menus: "to
-- authenticated using (true)"), plausibly still grants full access to any
-- authenticated Google account rather than just team members.
--
-- Unlike the earlier retrofit, this logs each dropped policy via
-- raise notice before removing it, so a future re-run against a database
-- with unexpected existing policies leaves a trace in the Postgres logs
-- instead of silently discarding them.

do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'tasks'
  loop
    raise notice 'Dropping policy % on public.tasks', pol.policyname;
    execute format('drop policy %I on public.tasks', pol.policyname);
  end loop;
end $$;

alter table public.tasks enable row level security;

create policy "team members full access" on public.tasks
  for all to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());
