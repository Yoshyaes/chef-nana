export interface GmailMessage {
  id: string
  threadId: string
  from: string
  subject: string
  body: string
  inReplyTo?: string
  rfcMessageId?: string
  date: string
}

export async function getGmailAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID!,
      client_secret: process.env.GMAIL_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error(`Gmail token error: ${data.error ?? 'unknown'}`)
  return data.access_token as string
}

export async function fetchNewMessageIds(
  accessToken: string,
  historyId: string
): Promise<{ messageIds: string[]; newHistoryId: string }> {
  const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/history')
  url.searchParams.set('startHistoryId', historyId)
  url.searchParams.set('historyTypes', 'messageAdded')

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Gmail history error: ${err.error?.message ?? res.status}`)
  }

  const data = await res.json()
  const newHistoryId = (data.historyId ?? historyId) as string

  const messageIds: string[] = []
  for (const record of (data.history ?? []) as { messagesAdded?: { message?: { id: string } }[] }[]) {
    for (const added of record.messagesAdded ?? []) {
      if (added.message?.id) messageIds.push(added.message.id)
    }
  }

  return { messageIds, newHistoryId }
}

export async function fetchGmailMessage(
  accessToken: string,
  messageId: string
): Promise<GmailMessage | null> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) return null
  const data = await res.json()

  const headers: Record<string, string> = {}
  for (const h of (data.payload?.headers ?? []) as { name: string; value: string }[]) {
    headers[h.name.toLowerCase()] = h.value
  }

  return {
    id: data.id as string,
    threadId: data.threadId as string,
    from: parseFromAddress(headers['from'] ?? ''),
    subject: headers['subject'] ?? '(no subject)',
    body: parseEmailBody(data.payload),
    inReplyTo: headers['in-reply-to'],
    rfcMessageId: headers['message-id'],
    date: headers['date'] ?? new Date().toISOString(),
  }
}

function parseFromAddress(from: string): string {
  const match = from.match(/<([^>]+)>/)
  return (match ? match[1] : from).toLowerCase().trim()
}

type GmailPart = {
  mimeType?: string
  body?: { data?: string }
  parts?: GmailPart[]
}

export function parseEmailBody(payload: GmailPart): string {
  if (!payload) return ''

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8')
  }

  if (payload.parts) {
    // Prefer text/plain over other parts
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain') {
        const text = parseEmailBody(part)
        if (text) return text
      }
    }
    // Fallback: recurse into any part
    for (const part of payload.parts) {
      const text = parseEmailBody(part)
      if (text) return text
    }
  }

  return ''
}

function encodeMimeHeader(value: string): string {
  if (/^[\x00-\x7F]*$/.test(value)) return value
  return `=?UTF-8?B?${Buffer.from(value, 'utf-8').toString('base64')}?=`
}

interface SendGmailReplyParams {
  to: string
  subject: string
  bodyText: string
  threadId?: string
  inReplyToRfcId?: string
}

export async function sendGmailReply(
  accessToken: string,
  { to, subject, bodyText, threadId, inReplyToRfcId }: SendGmailReplyParams
): Promise<{ id: string; threadId: string }> {
  const headerLines = [
    `From: Nana Wilmot <georginasfoods@gmail.com>`,
    `To: ${to}`,
    `Subject: ${encodeMimeHeader(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
  ]
  if (inReplyToRfcId) {
    headerLines.push(`In-Reply-To: ${inReplyToRfcId}`)
    headerLines.push(`References: ${inReplyToRfcId}`)
  }

  const raw = `${headerLines.join('\r\n')}\r\n\r\n${bodyText}`
  const encoded = Buffer.from(raw, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encoded, threadId }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Gmail send error: ${err.error?.message ?? res.status}`)
  }

  const data = await res.json()
  return { id: data.id as string, threadId: data.threadId as string }
}

export async function getGmailHistoryId(accessToken: string): Promise<string> {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  return (data.historyId ?? '') as string
}
