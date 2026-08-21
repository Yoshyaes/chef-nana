import { Resend } from 'resend'
import QRCode from 'qrcode'
import { createServiceClient } from '@/lib/supabase/server'

const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID

export function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

// Same settings.sending_domain lookup + fallback used by lib/approveDraft.ts
// and lib/email/taskNotifications.ts — ticket emails need to go out from the
// same verified-in-Resend domain those already use, not a guessed address.
async function getSendingDomain() {
  const supabase = await createServiceClient()
  const { data: settings } = await supabase.from('settings').select('sending_domain').single()
  return settings?.sending_domain ?? 'chefnanawilmot.com'
}

interface TicketEmailParams {
  to: string
  name: string
  eventTitle: string
  eventDate: string
  location: string | null
  qrToken: string
  quantity: number
}

export async function sendTicketEmail({ to, name, eventTitle, eventDate, location, qrToken, quantity }: TicketEmailParams) {
  // A real inline attachment (cid: reference) rather than a base64 data URI
  // in <img src> — Gmail and other major clients strip data URIs from HTML
  // emails, so the QR silently failed to render when sent that way.
  const qrPng = await QRCode.toBuffer(qrToken, { width: 320, margin: 1 })
  const sendingDomain = await getSendingDomain()

  await getResend().emails.send({
    from: `Chef Nana <tickets@${sendingDomain}>`,
    to,
    subject: `Your ticket — ${eventTitle}`,
    attachments: [
      {
        filename: 'ticket-qr.png',
        content: qrPng,
        contentId: 'ticket-qr',
      },
    ],
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #2C1A0E;">
        <h1 style="font-weight: 400; font-size: 26px;">You're in, ${name}.</h1>
        <p style="font-size: 15px; line-height: 1.7; color: #5C3A22;">
          ${eventTitle}<br />
          ${eventDate}${location ? ` · ${location}` : ''}
        </p>
        ${quantity > 1 ? `<p style="font-size: 14px; color: #5C3A22;">Party of ${quantity}</p>` : ''}
        <p style="font-size: 14px; color: #5C3A22;">Show this QR code at the door.</p>
        <img src="cid:ticket-qr" alt="Ticket QR code" width="240" height="240" />
      </div>
    `,
  })
}

interface OverflowEmailParams {
  to: string
  name: string
  eventTitle: string
}

export async function sendOverflowApologyEmail({ to, name, eventTitle }: OverflowEmailParams) {
  const sendingDomain = await getSendingDomain()

  await getResend().emails.send({
    from: `Chef Nana <tickets@${sendingDomain}>`,
    to,
    subject: `${eventTitle} — we couldn't confirm your seat`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #2C1A0E;">
        <h1 style="font-weight: 400; font-size: 24px;">We're sorry, ${name}.</h1>
        <p style="font-size: 15px; line-height: 1.7; color: #5C3A22;">
          ${eventTitle} sold out in the moment between your payment and our confirmation.
          You have not been charged — your payment was refunded in full and should appear
          on your statement within a few business days.
        </p>
      </div>
    `,
  })
}

interface UpsertContactParams {
  email: string
  name: string
}

export async function upsertTicketingContact({ email, name }: UpsertContactParams) {
  if (!RESEND_AUDIENCE_ID) return

  const [firstName, ...rest] = name.trim().split(' ')

  try {
    await getResend().contacts.create({
      audienceId: RESEND_AUDIENCE_ID,
      email,
      firstName,
      lastName: rest.join(' ') || undefined,
    })
  } catch (err) {
    // Best-effort — a duplicate contact or transient Resend error shouldn't
    // fail ticket fulfillment, which has already succeeded by this point.
    console.error('upsertTicketingContact failed', email, err)
  }
}
