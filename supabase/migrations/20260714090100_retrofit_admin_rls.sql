-- Retrofit RLS on every admin table to require profiles membership instead
-- of a broad "any authenticated session" check. Run after
-- 20260714090000_create_profiles.sql (this depends on public.is_team_member()).
--
-- Each block drops all existing policies on that table by name before
-- recreating, rather than a hardcoded drop policy if exists <name>, because
-- only menus' current policy name ("Admin can manage menus") is confirmed
-- from a migration file. leads, drafts, enrichment, messages, activity_log,
-- suppression_list, and settings were created directly against the live
-- database with no migration history, so their existing policy names are
-- not knowable ahead of time.
--
-- sequences and tasks are intentionally not touched here: sequences has no
-- backing table yet (placeholder page only), and tasks is an existing
-- AI-agent action queue unrelated to this auth work.

do $$
declare
  admin_table text;
  pol record;
begin
  foreach admin_table in array array['leads', 'drafts', 'menus', 'enrichment', 'messages', 'activity_log', 'suppression_list', 'settings']
  loop
    for pol in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = admin_table
    loop
      execute format('drop policy %I on public.%I', pol.policyname, admin_table);
    end loop;

    execute format('alter table public.%I enable row level security', admin_table);

    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_team_member()) with check (public.is_team_member())',
      'team members full access', admin_table
    );
  end loop;
end $$;
