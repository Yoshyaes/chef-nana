import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { fulfillSession } from '@/lib/fulfillment'

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  return secret
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
    await fulfillSession(event.data.object as Stripe.Checkout.Session)
  } else if (event.type === 'charge.refunded') {
    await handleChargeRefunded(event.data.object as Stripe.Charge)
  }

  return NextResponse.json({ received: true })
}
