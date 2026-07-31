-- Native ticketing (Nana Ticketing PRD, Phase 1): events + attendees, plus
-- the two SQL functions the app calls via .rpc() instead of doing
-- multi-statement work from the Next.js side. Apply via the Supabase SQL
-- editor or `supabase db push`.
--
-- fulfill_checkout is the capacity-race guard: the Supabase JS client has
-- no multi-statement transaction API, so the "lock the event row, recount
-- seats sold, then decide whether to insert" sequence has to happen as one
-- Postgres function call (one transaction) rather than several round trips
-- from the webhook handler, which would reopen the race between the lock
-- and the insert.

create table public.events (
  id              uuid        primary key default gen_random_uuid(),
  slug            text        not null unique,
  title           text        not null,
  description     text,
  event_date      timestamptz not null,
  location        text,
  price_cents     int         not null,
  currency        text        not null default 'usd',
  capacity        int         not null,
  image_url       text,
  status          text        not null default 'draft'
                              check (status in ('draft', 'published', 'sold_out', 'closed')),
  stripe_price_id text,
  created_at      timestamptz not null default now()
);

create index events_status_idx on public.events (status);

-- Cascade on delete: an event's attendee list has no meaning once the event
-- itself is gone, and events are only ever deleted deliberately from the
-- admin (never as a side effect of something else), so there's no risk of
-- silently wiping attendees via an unrelated cascade elsewhere.
create table public.attendees (
  id              uuid        primary key default gen_random_uuid(),
  event_id        uuid        not null references public.events(id) on delete cascade,
  name            text        not null,
  email           text        not null,
  quantity        int         not null default 1,
  stripe_session  text        not null unique,
  qr_token        text        not null unique,
  checked_in      boolean     not null default false,
  checked_in_at   timestamptz,
  refunded        boolean     not null default false,
  created_at      timestamptz not null default now()
);

create index attendees_event_id_idx on public.attendees (event_id);

alter table public.events enable row level security;
alter table public.attendees enable row level security;

create policy "team members full access" on public.events
  for all to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());

create policy "team members full access" on public.attendees
  for all to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());

-- API routes read/write via the service-role client (bypasses RLS
-- entirely), so this is defense-in-depth for any direct anon-key read from
-- the event page, not the primary access control. Draft events and the
-- attendee list are never exposed to anon.
create policy "public can view non-draft events" on public.events
  for select to anon
  using (status in ('published', 'sold_out', 'closed'));

-- Seats sold for an event = sum(quantity) of non-refunded attendees.
-- Seats left = events.capacity - seats_sold(event_id).
create or replace function public.seats_sold(p_event uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(quantity), 0)::int
  from public.attendees
  where event_id = p_event and not refunded;
$$;

-- Called once from the Stripe webhook handler on checkout.session.completed.
-- Idempotent on stripe_session (Stripe retries webhooks). Locks the event
-- row before recounting seats so two concurrent webhook deliveries for the
-- same event can't both read a stale count and both think there's room for
-- the last seat.
create or replace function public.fulfill_checkout(
  p_event   uuid,
  p_session text,
  p_name    text,
  p_email   text,
  p_qty     int,
  p_qr      text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity    int;
  v_sold        int;
  v_attendee_id uuid;
  v_existing    uuid;
begin
  select id into v_existing from public.attendees where stripe_session = p_session;
  if v_existing is not null then
    return jsonb_build_object('status', 'already_fulfilled', 'attendee_id', v_existing);
  end if;

  select capacity into v_capacity
  from public.events
  where id = p_event
  for update;

  if v_capacity is null then
    return jsonb_build_object('status', 'event_not_found');
  end if;

  select coalesce(sum(quantity), 0) into v_sold
  from public.attendees
  where event_id = p_event and not refunded;

  if v_sold + p_qty > v_capacity then
    return jsonb_build_object('status', 'overflow');
  end if;

  insert into public.attendees (event_id, name, email, quantity, stripe_session, qr_token)
  values (p_event, p_name, p_email, p_qty, p_session, p_qr)
  returning id into v_attendee_id;

  if v_sold + p_qty >= v_capacity then
    update public.events set status = 'sold_out' where id = p_event and status = 'published';
  end if;

  return jsonb_build_object('status', 'ok', 'attendee_id', v_attendee_id);
end;
$$;
