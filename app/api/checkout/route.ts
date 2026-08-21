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

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (!event || event.status !== 'published') {
    return NextResponse.json({ error: 'unavailable' }, { status: 400 })
  }

  // Soft check — cheap, catches the common case. The hard check that
  // actually guards against overselling happens inside fulfill_checkout,
  // which the webhook calls after payment succeeds. Never reveal how much
  // room is actually left — same generic response whether it's 0 seats or
  // just not enough for this quantity.
  const { data: sold } = await supabase.rpc('seats_sold', { p_event: eventId })
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

  return NextResponse.json({ clientSecret: session.client_secret })
}
