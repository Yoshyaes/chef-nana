import { randomBytes } from 'crypto'

// 16 random bytes (128 bits) — unguessable and effectively collision-free,
// enforced unique at the DB level (attendees.qr_token). No sequential IDs.
export function generateQrToken(): string {
  return randomBytes(16).toString('hex')
}

// Cheap format check before a DB round trip — the real validation is the
// lookup against attendees.qr_token in /api/checkin.
export function isValidQrTokenFormat(token: string): boolean {
  return /^[0-9a-f]{32}$/.test(token)
}
