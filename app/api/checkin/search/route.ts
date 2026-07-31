import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { hasValidCheckinPasscode } from '@/lib/checkinAuth'

export async function GET(req: NextRequest) {
  if (!hasValidCheckinPasscode(req)) {
    return NextResponse.json({ error: 'invalid passcode' }, { status: 401 })
  }

  const q = new URL(req.url).searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ attendees: [] })
  }

  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('attendees')
    .select('id, name, email, qr_token, checked_in, refunded, events(title, event_date)')
    .ilike('name', `%${q}%`)
    .eq('refunded', false)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ attendees: data })
}
