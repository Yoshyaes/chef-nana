-- Records every Stripe Checkout Session as soon as it's created, so the
-- admin can see how many people started checkout vs. how many completed it
-- (attendees only records completions). A row stuck at 'started' past the
-- session's expiry is an abandoned checkout.

create table public.checkout_sessions (
  stripe_session text        primary key,
  event_id       uuid        not null references public.events(id) on delete cascade,
  quantity       int         not null,
  status         text        not null default 'started'
                             check (status in ('started', 'completed')),
  created_at     timestamptz not null default now(),
  completed_at   timestamptz
);

create index checkout_sessions_event_id_idx on public.checkout_sessions (event_id);

alter table public.checkout_sessions enable row level security;

create policy "team members full access" on public.checkout_sessions
  for all to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());
