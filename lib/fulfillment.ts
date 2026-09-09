import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { generateQrToken } from '@/lib/qr'
import { sendTicketEmail, sendOverflowApologyEmail, upsertTicketingContact } from '@/lib/resend'

// Single implementation of "a paid Checkout Session becomes a confirmed
// attendee", shared by the Stripe webhook (the fast path) and the reconcile
// cron (the safety net). It lived only in the webhook before, and the
// standalone reconcile script had reimplemented a thinner copy that quietly
// recorded every order as one seat — exactly the drift this consolidation
// exists to prevent.
//
// Idempotent: fulfill_checkout is keyed on the Checkout Session id, so a
// replay returns 'already_fulfilled' rather than double-booking a seat.

export type FulfillResult =
  | 'ok'
  | 'already_fulfilled'
  | 'overflow'
  | 'event_not_found'
  | 'incomplete_session'
  | 'rpc_failed'

export async function fulfillSession(session: Stripe.Checkout.Session): Promise<FulfillResult> {
  const eventId = session.metadata?.event_id
  const email = session.customer_details?.email
  if (!eventId || !email) {
    console.error('session missing event_id or email', session.id)
    return 'incomplete_session'
  }

  const nameField = session.custom_fields?.find(f => f.key === 'attendee_name')
  const name = nameField?.text?.value || email
  const qty = Number(session.metadata?.quantity) || 1

  const supabase = await createServiceClient()

  // Funnel record — payment succeeded regardless of what fulfill_checkout
  // decides below (overflow still means the checkout itself completed).
  // Runs here rather than in the webhook route so a reconcile-cron backfill
  // updates it too.
  await supabase
    .from('checkout_sessions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('stripe_session', session.id)

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
    p_qty: qty,
    p_qr: qrToken,
  })

  if (error) {
    console.error('fulfill_checkout RPC failed', session.id, error)
    return 'rpc_failed'
  }

  const status = data?.status

  if (status === 'overflow') {
    // Money already moved and the seat is gone — refund instead of
    // confirming, then email an apology.
    if (typeof session.payment_intent === 'string') {
      await getStripe().refunds.create({ payment_intent: session.payment_intent })
    }
    if (event) {
      await sendOverflowApologyEmail({ to: email, name, eventTitle: event.title })
    }
    console.warn('checkout overflow, refunded', session.id)
    return 'overflow'
  }

  if (status === 'already_fulfilled') return 'already_fulfilled'

  if (status === 'event_not_found' || !event) {
    console.error('fulfill_checkout: event not found', eventId, session.id)
    return 'event_not_found'
  }

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
    quantity: qty,
  })
  await upsertTicketingContact({ email, name })

  return 'ok'
}
