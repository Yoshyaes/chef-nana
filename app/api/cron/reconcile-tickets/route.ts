import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { fulfillSession, type FulfillResult } from '@/lib/fulfillment'

// Safety net for the webhook. A Checkout Session that Stripe could not
// deliver — endpoint missing for the mode, wrong signing secret, an outage,
// a deploy mid-flight — leaves money taken and no attendee row, so the seat
// count reads low, the guest never gets a ticket, and nothing surfaces the
// problem. This re-reads recent paid sessions and fulfils whatever the
// webhook missed.
//
// Runs through the same fulfillSession() the webhook uses, so a backfilled
// attendee is indistinguishable from a live one: same capacity guard, same
// overflow refund, same ticket email. Safe to run repeatedly — fulfil is
// keyed on the session id, and already-recorded sessions are filtered out
// before the RPC anyway.

export const maxDuration = 60

// A flat `limit: 100` only sees the 100 most-recently-created sessions —
// fine when volume is low, but a burst of unrelated traffic (a bot flood
// creating hundreds of sessions in a day, since fixed, is exactly what
// happened here) pushes a real payment from days ago out of that window
// entirely, silently defeating the one job that exists to catch missed
// payments. Page back through everything in a bounded window instead.
const RECONCILE_LOOKBACK_DAYS = 45
const RECONCILE_MAX_SESSIONS = 2000

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sinceTimestamp = Math.floor(Date.now() / 1000) - RECONCILE_LOOKBACK_DAYS * 24 * 60 * 60
  const sessions = await getStripe()
    .checkout.sessions.list({ limit: 100, created: { gte: sinceTimestamp } })
    .autoPagingToArray({ limit: RECONCILE_MAX_SESSIONS })
  const paid = sessions.filter(s => s.status === 'complete' && s.payment_status === 'paid')

  if (paid.length === 0) {
    return NextResponse.json({ checked: sessions.length, paid: 0, backfilled: 0 })
  }

  // One query for the whole batch rather than a round trip per session.
  const supabase = await createServiceClient()
  const { data: known } = await supabase
    .from('attendees')
    .select('stripe_session')
    .in('stripe_session', paid.map(s => s.id))

  const recorded = new Set((known ?? []).map(a => a.stripe_session))
  const missing = paid.filter(s => !recorded.has(s.id))

  const results: Record<string, number> = {}
  for (const session of missing) {
    let outcome: FulfillResult
    try {
      outcome = await fulfillSession(session)
    } catch (err) {
      // One bad session must not strand the rest of the batch.
      console.error('reconcile: fulfillSession threw', session.id, err)
      outcome = 'rpc_failed'
    }
    results[outcome] = (results[outcome] ?? 0) + 1
  }

  const backfilled = results.ok ?? 0
  if (backfilled > 0) {
    console.warn(`reconcile: backfilled ${backfilled} session(s) the webhook missed`)
  }

  return NextResponse.json({
    checked: sessions.length,
    paid: paid.length,
    missing: missing.length,
    backfilled,
    outcomes: results,
  })
}
