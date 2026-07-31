// Phase 3 hardening: catches the "webhook missed" risk from the ticketing
// PRD — re-reads recent completed Stripe Checkout Sessions and backfills
// any attendee the webhook failed to create. Run manually after a launch,
// or on a schedule later if it proves useful.
//
// Usage: node --env-file=.env.local scripts/reconcile-stripe-sessions.mjs

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const stripeKey = process.env.STRIPE_SECRET_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
  console.error('Missing STRIPE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const stripe = new Stripe(stripeKey)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

function generateQrToken() {
  return randomBytes(16).toString('hex')
}

async function main() {
  const sessions = await stripe.checkout.sessions.list({ limit: 100 })

  const completed = sessions.data.filter(s => s.status === 'complete' && s.payment_status === 'paid')
  console.log(`Checked ${sessions.data.length} recent sessions, ${completed.length} completed.`)

  let backfilled = 0

  for (const session of completed) {
    const { data: existing } = await supabase
      .from('attendees')
      .select('id')
      .eq('stripe_session', session.id)
      .maybeSingle()

    if (existing) continue

    const eventId = session.metadata?.event_id
    const email = session.customer_details?.email
    if (!eventId || !email) {
      console.warn(`Skipping ${session.id}: missing event_id or email in session data.`)
      continue
    }

    const nameField = session.custom_fields?.find(f => f.key === 'attendee_name')
    const name = nameField?.text?.value || email

    const { data, error } = await supabase.rpc('fulfill_checkout', {
      p_event: eventId,
      p_session: session.id,
      p_name: name,
      p_email: email,
      p_qty: 1,
      p_qr: generateQrToken(),
    })

    if (error) {
      console.error(`fulfill_checkout failed for ${session.id}:`, error.message)
      continue
    }

    if (data?.status === 'ok') {
      backfilled++
      console.log(`Backfilled attendee for session ${session.id} (${email}). Ticket email not resent — send manually if needed.`)
    } else {
      console.warn(`Session ${session.id} resolved as "${data?.status}" — not backfilled.`)
    }
  }

  console.log(`Done. Backfilled ${backfilled} missed attendee(s).`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
