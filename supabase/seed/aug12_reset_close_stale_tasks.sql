-- Aug 12, 2026 team meeting reset, phase 1: close out the stale Jul 25 task
-- list, carry forward the handful still active. Run once in the Supabase SQL
-- editor. Matches the raw-SQL pattern in seed_master_task_list.sql rather
-- than the API routes, so it bypasses sendTaskAssignedEmail entirely (that
-- only fires from the POST/PATCH handlers) and needs no notification
-- suppression.
--
-- Idempotent: the close pass only touches rows where status != 'done', and
-- the activity insert is driven off that update's RETURNING set, so a
-- second run matches zero rows and logs nothing twice. The carry-forward
-- pass just re-sets the same due_date, which is a no-op on rerun.
--
-- Catch-all rule: any task due before 2026-08-12 that isn't in the explicit
-- close list or the explicit carry-forward list also gets closed with the
-- same note. Checked against live data before writing this: the six rows it
-- catches are Fred's [Blocked] 30-contact outreach, Affiliate link
-- tracking, Tasks + multi-user auth build, Scoring and routing model,
-- [Blocked] Website: six changes, and Jillian's [Blocked] Event type rules
-- (all due Aug 7). Confirmed with Fred before this script was written.

do $$
declare
  fred_id uuid;
  reset_note text := 'Closed in Aug 12 reset, superseded';
  reset_cutoff date := '2026-08-12';
  explicit_close text[] := array[
    '[Verify] 103rd birthday decline',
    '[Verify] Tanisha Jul 25 event',
    'DC + Ghana email sequence',
    'Assistant persona swap + Discord tagging',
    'Email domain options + pricing',
    '[Verify] Anthropic API key',
    'BEM counter or accept',
    'Ticket button, phase 1',
    'Event kit + vetting package'
  ];
  carry_forward text[] := array[
    '[Verify] Cloudflare email routing for info@',
    'Review event standards sheet v2',
    'Triage layer: high-touch classification',
    'Tiered intake forms'
  ];
  r record;
begin
  select id into strict fred_id from public.profiles where full_name = 'Fred';

  for r in
    select title from public.team_tasks
    where status != 'done'
      and due_date < reset_cutoff
      and title != all(explicit_close)
      and title != all(carry_forward)
  loop
    raise notice 'Catch-all close: %', r.title;
  end loop;

  with to_close as (
    update public.team_tasks
    set status = 'done', completed_at = now(), updated_at = now()
    where status != 'done'
      and (
        title = any(explicit_close)
        or (due_date < reset_cutoff and title != all(carry_forward))
      )
    returning id
  )
  insert into public.task_activity (task_id, actor_id, action, detail)
  select id, fred_id, 'status_changed', jsonb_build_object('from', 'open', 'to', 'done', 'note', reset_note)
  from to_close;

  update public.team_tasks
  set due_date = case title
      when '[Verify] Cloudflare email routing for info@' then '2026-08-21'::date
      when 'Review event standards sheet v2' then '2026-08-20'::date
      when 'Triage layer: high-touch classification' then '2026-09-04'::date
      when 'Tiered intake forms' then '2026-09-04'::date
    end,
    updated_at = now()
  where title = any(carry_forward);
end $$;
