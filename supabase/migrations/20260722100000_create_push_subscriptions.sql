-- Web Push subscriptions (Phase 3 of the mobile redesign) — one row per
-- device that has opted in, keyed to the team member who registered it.
-- Apply this in the Supabase SQL editor or via `supabase db push`.
--
-- Push send/receive is team-wide rather than per-user-targeted: the three
-- push-type toggles below live on the shared `settings` singleton (same
-- pattern as approve_before_sending), and a triggering event pushes to
-- every subscribed device when its toggle is on. Per-user opt-out of
-- individual push types is not modeled — matches how Discord notifications
-- already work today (one shared channel, not per-recipient preferences).

create table public.push_subscriptions (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  endpoint    text        not null unique,
  p256dh      text        not null,
  auth        text        not null,
  created_at  timestamptz not null default now()
);

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "team members full access" on public.push_subscriptions
  for all to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());

-- Per-type push toggles, alongside the existing approve_before_sending
-- singleton setting.
alter table public.settings
  add column if not exists push_new_drafts   boolean not null default true,
  add column if not exists push_hot_replies  boolean not null default true,
  add column if not exists push_brief_ready  boolean not null default true;
