-- Native ticketing, Phase 2: refund handling. Apply via the Supabase SQL
-- editor or `supabase db push`, after 20260730100000_create_ticketing.sql.
--
-- Reverse of the sold_out flip in fulfill_checkout: called from the
-- webhook's charge.refunded handler. fulfill_checkout only ever flips an
-- event forward to sold_out, so freeing a seat on refund needs its own
-- explicit transition back to published.
create or replace function public.refund_attendee(p_stripe_session text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_capacity int;
  v_sold     int;
begin
  update public.attendees
  set refunded = true
  where stripe_session = p_stripe_session and not refunded
  returning event_id into v_event_id;

  if v_event_id is null then
    return jsonb_build_object('status', 'not_found_or_already_refunded');
  end if;

  select capacity into v_capacity from public.events where id = v_event_id for update;
  select coalesce(sum(quantity), 0) into v_sold
  from public.attendees
  where event_id = v_event_id and not refunded;

  if v_sold < v_capacity then
    update public.events set status = 'published' where id = v_event_id and status = 'sold_out';
  end if;

  return jsonb_build_object('status', 'ok', 'event_id', v_event_id);
end;
$$;
