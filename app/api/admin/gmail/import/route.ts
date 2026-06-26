import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getGmailAccessToken } from '@/lib/gmail'
import { inngest } from '@/inngest/client'

function parseSender(from: string): { name: string; email: string } | null {
  // RFC 2822: "Display Name" <email@example.com> or just email@example.com
  const match = from.match(/^(?:"?([^"<]*)"?\s*)?<?([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})>?$/)
  if (!match) return null
  const email = match[2].toLowerCase().trim()
  const name = (match[1] ?? '').trim() || email.split('@')[0]
  return { name, email }
}

function daysAgoFormatted(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

export async function POST() {
  const supabase = await createServiceClient()

  const { data: settings } = await supabase
    .from('settings')
    .select('gmail_refresh_token')
    .single()

  if (!settings?.gmail_refresh_token) {
    return NextResponse.json({ error: 'Gmail not connected. Connect Gmail in Settings first.' }, { status: 400 })
  }

  let accessToken: string
  try {
    accessToken = await getGmailAccessToken(settings.gmail_refresh_token)
  } catch (e) {
    return NextResponse.json({ error: `Gmail auth failed: ${e}` }, { status: 500 })
  }

  const since = daysAgoFormatted(60)
  const messageIds: string[] = []
  let pageToken: string | undefined

  // Paginate through inbox, hard cap at 500 messages
  while (messageIds.length < 500) {
    const params = new URLSearchParams({
      q: `in:inbox after:${since}`,
      maxResults: '100',
    })
    if (pageToken) params.set('pageToken', pageToken)

    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!listRes.ok) break
    const listData = await listRes.json()

    for (const m of listData.messages ?? []) messageIds.push(m.id as string)
    if (!listData.nextPageToken || messageIds.length >= 500) break
    pageToken = listData.nextPageToken as string
  }

  // Fetch From header for each message (metadata only — fast)
  const senders = new Map<string, string>() // email → name

  await Promise.all(
    messageIds.map(async (id) => {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (!res.ok) return
      const data = await res.json()
      const fromHeader = (data.payload?.headers as { name: string; value: string }[] | undefined)
        ?.find(h => h.name === 'From')?.value
      if (!fromHeader) return
      const parsed = parseSender(fromHeader)
      if (parsed && !senders.has(parsed.email)) {
        senders.set(parsed.email, parsed.name)
      }
    })
  )

  if (senders.size === 0) {
    return NextResponse.json({ imported: 0, skipped: 0, message: 'No messages found in the last 60 days.' })
  }

  // Find which emails already exist
  const emailList = Array.from(senders.keys())
  const { data: existing } = await supabase
    .from('leads')
    .select('email')
    .in('email', emailList)

  const existingEmails = new Set((existing ?? []).map(r => r.email as string))

  const toInsert = emailList
    .filter(email => !existingEmails.has(email))
    .map(email => ({
      name: senders.get(email)!,
      email,
      source: 'gmail_import',
      stage: 'sourced',
    }))

  if (toInsert.length > 0) {
    const { data: inserted } = await supabase.from('leads').insert(toInsert).select('id')
    // Trigger AI research for each new lead (fills org, fit score, value/yr via Apollo + Claude)
    if (inserted && inserted.length > 0) {
      await Promise.all(
        inserted.map(row =>
          inngest.send({ name: 'lead/research.requested', data: { leadId: row.id } }).catch(() => {})
        )
      )
    }
  }

  return NextResponse.json({
    imported: toInsert.length,
    skipped: emailList.length - toInsert.length,
  })
}
