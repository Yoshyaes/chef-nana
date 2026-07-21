-- Comments, activity trail, and digest idempotency log for team_tasks.

create table public.task_comments (
  id          uuid        primary key default gen_random_uuid(),
  task_id     uuid        not null references public.team_tasks(id) on delete cascade,
  author_id   uuid        not null references public.profiles(id),
  body        text        not null,
  created_at  timestamptz not null default now()
);

create table public.task_activity (
  id          uuid        primary key default gen_random_uuid(),
  task_id     uuid        not null references public.team_tasks(id) on delete cascade,
  actor_id    uuid        not null references public.profiles(id),
  action      text        not null, -- created | reassigned | status_changed | due_changed | edited | commented
  detail      jsonb,
  created_at  timestamptz not null default now()
);

create table public.task_digest_log (
  user_id  uuid not null references public.profiles(id),
  sent_on  date not null,
  primary key (user_id, sent_on)
);

create index task_comments_task_idx on public.task_comments (task_id, created_at);
create index task_activity_task_idx on public.task_activity (task_id, created_at);

alter table public.task_comments enable row level security;
alter table public.task_activity enable row level security;
alter table public.task_digest_log enable row level security;

create policy "team members full access" on public.task_comments
  for all to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());

create policy "team members full access" on public.task_activity
  for all to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());

create policy "team members full access" on public.task_digest_log
  for all to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());
