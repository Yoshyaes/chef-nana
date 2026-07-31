import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { hasValidCheckinPasscode } from '@/lib/checkinAuth'
import { isValidQrTokenFormat } from '@/lib/qr'

export async function POST(req: NextRequest) {
  if (!hasValidCheckinPasscode(req)) {
    return NextResponse.json({ error: 'invalid passcode' }, { status: 401 })
  }

  const { qr_token } = await req.json()
  if (!qr_token || !isValidQrTokenFormat(qr_token)) {
    return NextResponse.json({ error: 'invalid ticket' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  const { data: attendee, error } = await supabase
    .from('attendees')
    .select('id, name, email, checked_in, checked_in_at, refunded, event_id, events(title)')
    .eq('qr_token', qr_token)
    .single()

  if (error || !attendee) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  if (attendee.refunded) {
    return NextResponse.json({ error: 'refunded', attendee }, { status: 409 })
  }

  if (attendee.checked_in) {
    return NextResponse.json({ error: 'already_checked_in', attendee }, { status: 409 })
  }

  const { data: updated, error: updateError } = await supabase
    .from('attendees')
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq('id', attendee.id)
    .select('id, name, email, checked_in, checked_in_at, event_id, events(title)')
    .single()

  if (updateError || !updated) {
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }

  return NextResponse.json({ attendee: updated })
}
