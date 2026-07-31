import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { generateQrToken } from '@/lib/qr'
import { sendTicketEmail, sendOverflowApologyEmail, upsertTicketingContact } from '@/lib/resend'

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  return secret
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const eventId = session.metadata?.event_id
  const email = session.customer_details?.email
  if (!eventId || !email) {
    console.error('checkout.session.completed missing event_id or email', session.id)
    return
  }

  const nameField = session.custom_fields?.find(f => f.key === 'attendee_name')
  const name = nameField?.text?.value || email

  const supabase = await createServiceClient()

  const { data: event } = await supabase
    .from('events')
    .select('title, event_date, location')
    .eq('id', eventId)
    .single()

  const qrToken = generateQrToken()
  const { data, error } = await supabase.rpc('fulfill_checkout', {
    p_event: eventId,
    p_session: session.id,
    p_name: name,
    p_email: email,
    p_qty: 1,
    p_qr: qrToken,
  })

  if (error) {
    console.error('fulfill_checkout RPC failed', session.id, error)
    return
  }

  const status = data?.status

  if (status === 'overflow') {
    // Money already moved and the seat is gone — refund instead of
    // confirming, then email an apology. Source of truth is the webhook,
    // since it fires after payment actually succeeds.
    if (typeof session.payment_intent === 'string') {
      await getStripe().refunds.create({ payment_intent: session.payment_intent })
    }
    if (event) {
      await sendOverflowApologyEmail({ to: email, name, eventTitle: event.title })
    }
    console.warn('checkout overflow, refunded', session.id)
    return
  }

  if (status === 'already_fulfilled') {
    // Stripe retry of an event we've already processed — no-op.
    return
  }

  if (status === 'event_not_found' || !event) {
    console.error('fulfill_checkout: event not found', eventId, session.id)
    return
  }

  // status === 'ok'
  await sendTicketEmail({
    to: email,
    name,
    eventTitle: event.title,
    eventDate: new Date(event.event_date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    location: event.location,
    qrToken,
  })
  await upsertTicketingContact({ email, name })
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
  if (!paymentIntentId) return

  // attendees is keyed on the Checkout Session id, not the PaymentIntent —
  // a manual refund from the Stripe dashboard only gives us the charge, so
  // walk back from payment_intent to the session that created it.
  const sessions = await getStripe().checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 })
  const session = sessions.data[0]
  if (!session) {
    console.error('charge.refunded: no checkout session for payment_intent', paymentIntentId)
    return
  }

  const supabase = await createServiceClient()
  const { error } = await supabase.rpc('refund_attendee', { p_stripe_session: session.id })
  if (error) {
    console.error('refund_attendee RPC failed', session.id, error)
  }
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 })
  }

  const body = await req.text()

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, getWebhookSecret())
  } catch (err) {
    console.error('Stripe webhook signature verification failed', err)
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
  } else if (event.type === 'charge.refunded') {
    await handleChargeRefunded(event.data.object as Stripe.Charge)
  }

  return NextResponse.json({ received: true })
}
