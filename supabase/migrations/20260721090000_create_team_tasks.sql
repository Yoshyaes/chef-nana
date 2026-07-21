-- team_tasks: shared task tracking for Fred, Jillian, and Nana (owner, due
-- date, status, priority, optional link to a lead or menu). Named
-- team_tasks rather than tasks because an unrelated AI-agent action queue
-- table already exists as tasks, feeding the Today view triage, and this
-- would collide with it.
--
-- lead_id assumes leads.id is uuid, matching every other confirmed primary
-- key in this database (profiles.id, menus.id). This was not directly
-- verifiable from the repo since leads has no migration file. If this
-- assumption is wrong, this migration fails loudly on apply rather than
-- corrupting anything, and the column type below needs to change to match.

create table public.team_tasks (
  id            uuid        primary key default gen_random_uuid(),
  title         text        not null,
  notes         text,
  status        text        not null default 'open' check (status in ('open', 'in_progress', 'done')),
  priority      text        not null default 'medium' check (priority in ('low', 'medium', 'high')),
  owner_id      uuid        not null references public.profiles(id),
  created_by    uuid        not null references public.profiles(id),
  due_date      date,
  lead_id       uuid        references public.leads(id) on delete set null,
  menu_id       uuid        references public.menus(id) on delete set null,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index team_tasks_owner_status_idx on public.team_tasks (owner_id, status);
create index team_tasks_due_idx on public.team_tasks (due_date) where status != 'done';

alter table public.team_tasks enable row level security;

create policy "team members full access" on public.team_tasks
  for all to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());
