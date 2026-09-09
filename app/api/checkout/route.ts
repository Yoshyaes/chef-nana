import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { MAX_TICKETS_PER_ORDER } from '@/lib/ticketing'

export async function POST(req: NextRequest) {
  const { eventId, quantity = 1 } = await req.json()
  if (!eventId) {
    return NextResponse.json({ error: 'eventId is required' }, { status: 400 })
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_TICKETS_PER_ORDER) {
    return NextResponse.json({ error: 'invalid_quantity' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Both reads depend only on eventId, so they go together — run serially
  // this sat on the critical path of the embedded form appearing, and the
  // seat count was waiting on a row it never needed.
  const [{ data: event }, { data: sold }] = await Promise.all([
    supabase
      .from('events')
      .select('slug, title, status, capacity, currency, price_cents')
      .eq('id', eventId)
      .single(),
    supabase.rpc('seats_sold', { p_event: eventId }),
  ])

  if (!event || event.status !== 'published') {
    return NextResponse.json({ error: 'unavailable' }, { status: 400 })
  }

  // Soft check — cheap, catches the common case. The hard check that
  // actually guards against overselling happens inside fulfill_checkout,
  // which the webhook calls after payment succeeds. Never reveal how much
  // room is actually left — same generic response whether it's 0 seats or
  // just not enough for this quantity.
  if ((sold ?? 0) + quantity > event.capacity) {
    return NextResponse.json({ error: 'unavailable' }, { status: 409 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    return NextResponse.json({ error: 'server misconfigured' }, { status: 500 })
  }

  const session = await getStripe().checkout.sessions.create({
    ui_mode: 'embedded_page',
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: event.currency,
          unit_amount: event.price_cents,
          product_data: { name: event.title },
        },
        quantity,
      },
    ],
    metadata: { event_id: eventId, quantity: String(quantity) },
    // Checkout only guarantees an email by default — a name field has to be
    // requested explicitly so the webhook has something to put on the
    // attendee record and the door check-in name search.
    custom_fields: [
      {
        key: 'attendee_name',
        label: { type: 'custom', custom: 'Name on the reservation' },
        type: 'text',
      },
    ],
    return_url: `${siteUrl}/events/${event.slug}/confirmed?session_id={CHECKOUT_SESSION_ID}`,
  })

  // Funnel record — lets the admin see checkout starts vs. completions
  // (attendees only ever records the latter). Best-effort: a failure here
  // shouldn't block the guest from checking out.
  const { error: insertError } = await supabase
    .from('checkout_sessions')
    .insert({ stripe_session: session.id, event_id: eventId, quantity })
  if (insertError) {
    console.error('checkout_sessions insert failed', session.id, insertError)
  }

  return NextResponse.json({ clientSecret: session.client_secret })
}
