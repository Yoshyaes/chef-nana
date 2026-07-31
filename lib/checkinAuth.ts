import { NextRequest } from 'next/server'

// The entire auth mechanism for /checkin routes for MVP: a shared passcode
// sent as a header on every request, never a persisted cookie. Deliberately
// not Supabase Auth — door staff need something they can type on a phone in
// the dark, not a Google sign-in. Revisit before staff scales (PRD).
export function hasValidCheckinPasscode(req: NextRequest): boolean {
  const configured = process.env.CHECKIN_PASSCODE
  if (!configured) return false

  const provided = req.headers.get('x-checkin-passcode')
  return provided === configured
}
