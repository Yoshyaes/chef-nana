import { NextRequest, NextResponse } from 'next/server'
import { hasValidCheckinPasscode } from '@/lib/checkinAuth'

// Lets the /checkin UI confirm a passcode before showing the scanner, so a
// wrong entry gets a clear "wrong passcode" message instead of surfacing as
// a failed scan later.
export async function POST(req: NextRequest) {
  if (!hasValidCheckinPasscode(req)) {
    return NextResponse.json({ error: 'invalid passcode' }, { status: 401 })
  }
  return NextResponse.json({ ok: true })
}
