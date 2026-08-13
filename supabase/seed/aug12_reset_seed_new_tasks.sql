-- Aug 12, 2026 team meeting reset, phase 2: seed the new task list. Run once
-- in the Supabase SQL editor, after aug12_reset_close_stale_tasks.sql.
--
-- Matches on title so a rerun updates (owner, due_date) rather than
-- duplicating. team_tasks.title has no unique constraint, so this is done
-- as a manual per-row upsert (update, then insert only if nothing matched)
-- instead of an ON CONFLICT clause.
--
-- One exception: "Review newsletter draft in Drive" is assigned to both
-- Nana and Jillian as two separate tasks. Matching on title alone would
-- collapse the second upsert into the first row. Matched on title + owner
-- for that title only, everything else matches on title alone as specified.
--
-- No priority given for any of these, so all take the schema default
-- ('medium'). due_date is nullable, so the four backlog items insert with a
-- null due date rather than a placeholder.

do $$
declare
  fred_id uuid;
  v record;
begin
  select id into strict fred_id from public.profiles where full_name = 'Fred';

  for v in
    select t.title, o.id as owner_id, t.due_date
    from (values
      -- Ticketing
      ('Complete Stripe account setup', 'Nana', '2026-08-13'::date),
      ('Decide personal vs business banking on Stripe', 'Nana', '2026-08-13'::date),
      ('Connect Stripe keys, enable BEM 9/9 ticket sales', 'Fred', '2026-08-19'::date),
      ('Publish BEM ticket link and announcement send', 'Fred', '2026-08-21'::date),

      -- Newsletter and list
      ('Set up shared Drive folder for newsletter drafts', 'Fred', '2026-08-13'::date),
      ('Update signup form to require first name and location', 'Fred', '2026-08-15'::date),
      ('Build location segments in Resend', 'Fred', '2026-08-19'::date),
      ('Newsletter template for non-event sends', 'Fred', '2026-08-20'::date),
      ('Draft August send 2 to Drive', 'Fred', '2026-08-19'::date),
      ('Review newsletter draft in Drive', 'Nana', '2026-08-20'::date),
      ('Review newsletter draft in Drive', 'Jillian', '2026-08-20'::date),
      ('Draft list refresh email', 'Fred', '2026-08-19'::date),
      ('Send list refresh email', 'Fred', '2026-08-22'::date),

      -- Website and calendar
      ('Update events page with confirmed dates', 'Fred', '2026-08-15'::date),
      ('Add exact times and event type labels to Georgina''s calendar', 'Jillian', '2026-08-19'::date),
      ('Send personal email for weekly invite', 'Jillian', '2026-08-12'::date),
      ('Send digitized menus and photos of physical copies', 'Nana', '2026-08-19'::date),

      -- Growth and BD
      ('Send residency and in-house chef target list', 'Fred', '2026-08-12'::date),
      ('Review target list', 'Nana', '2026-08-19'::date),
      ('Start residency outreach', 'Fred', '2026-08-20'::date),
      ('ManyChat vs competitors recommendation', 'Fred', '2026-08-20'::date),
      ('Add Fred and Jillian to Meta Business Suite', 'Nana', '2026-08-19'::date),
      ('Spirits sponsorship one-pager and target list', 'Fred', '2026-08-27'::date),

      -- The Pass
      ('Forward The Pass beta email to Jillian', 'Fred', '2026-08-12'::date),
      ('Review The Pass, name 5 chefs to invite', 'Nana', '2026-08-19'::date),

      -- Nana operating habits
      ('Text DC chef, keep conversation going', 'Nana', '2026-08-12'::date),
      ('Send October vacation window', 'Nana', '2026-08-19'::date),
      ('Confirm LA podcast dates, scope pop-up', 'Nana', '2026-08-22'::date),
      ('Confirm Charlotte Oct 6, scope pop-up around it', 'Nana', '2026-08-22'::date),
      ('Block 8 to 9pm writing sessions on calendar', 'Nana', '2026-08-19'::date),
      ('Order laptop from recommendation list', 'Nana', '2026-08-22'::date),

      -- Backlog, no due date
      ('Fun Nana content account concept', 'Fred', null::date),
      ('Top Chef compliance do and don''t sheet from Magical Elves', 'Fred', null::date),
      ('PO box or virtual mailbox for gifting', 'Fred', null::date),
      ('Overflow referral SOP and fee structure', 'Fred', null::date)
    ) as t(title, owner_name, due_date)
    join public.profiles o on o.full_name = t.owner_name
  loop
    update public.team_tasks
    set owner_id = v.owner_id, due_date = v.due_date, updated_at = now()
    where title = v.title
      and (v.title != 'Review newsletter draft in Drive' or owner_id = v.owner_id);

    if not found then
      insert into public.team_tasks (title, owner_id, created_by, due_date)
      values (v.title, v.owner_id, fred_id, v.due_date);
    end if;
  end loop;
end $$;
