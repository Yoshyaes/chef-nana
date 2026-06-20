import { NextResponse } from 'next/server'
import { createSign } from 'crypto'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSanityClient } from '@/lib/sanity/server'

// ── GA4 ──────────────────────────────────────────────────────────────────────

async function getGA4Token(email: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    iss: email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  })).toString('base64url')

  const sign = createSign('RSA-SHA256')
  sign.update(`${header}.${payload}`)
  const signature = sign.sign(privateKey, 'base64url')
  const jwt = `${header}.${payload}.${signature}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  })
  const data = await res.json()
  return data.access_token
}

async function fetchGA4() {
  const propertyId = process.env.GA4_PROPERTY_ID
  const keyJson = process.env.GA4_SERVICE_ACCOUNT_KEY
  if (!propertyId || !keyJson) return null

  let key: { client_email: string; private_key: string }
  try { key = JSON.parse(keyJson) } catch { return null }

  const token = await getGA4Token(key.client_email, key.private_key)
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`

  const [res7, res30] = await Promise.all([
    fetch(url, {
      method: 'POST', headers,
      body: JSON.stringify({
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'sessions' }, { name: 'activeUsers' }],
      }),
    }),
    fetch(url, {
      method: 'POST', headers,
      body: JSON.stringify({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'sessions' }],
      }),
    }),
  ])

  if (!res7.ok || !res30.ok) return null
  const [d7, d30] = await Promise.all([res7.json(), res30.json()])

  const vals = (d: { rows?: { metricValues: { value: string }[] }[] }) =>
    (d.rows?.[0]?.metricValues ?? []).map((m) => parseInt(m.value ?? '0', 10))

  const [views7 = 0, sessions7 = 0, users7 = 0] = vals(d7)
  const [views30 = 0, sessions30 = 0] = vals(d30)

  return {
    last7Days: { pageViews: views7, sessions: sessions7, activeUsers: users7 },
    last30Days: { pageViews: views30, sessions: sessions30 },
  }
}

// ── Vercel ───────────────────────────────────────────────────────────────────

async function fetchVercel() {
  const token = process.env.VERCEL_API_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  if (!token || !projectId) return null

  const params = new URLSearchParams({ projectId, limit: '5' })
  const teamId = process.env.VERCEL_TEAM_ID
  if (teamId) params.set('teamId', teamId)

  const res = await fetch(`https://api.vercel.com/v6/deployments?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null

  const { deployments = [] } = await res.json()
  const fmt = (d: { state: string; created: number; meta?: { githubCommitMessage?: string }; url?: string }) => ({
    state: d.state as string,
    created: d.created as number,
    commitMessage: (d.meta?.githubCommitMessage ?? null) as string | null,
    url: (d.url ?? null) as string | null,
  })

  return {
    latest: deployments[0] ? fmt(deployments[0]) : null,
    recent: (deployments as Parameters<typeof fmt>[0][]).slice(0, 5).map(fmt),
  }
}

// ── Sanity ───────────────────────────────────────────────────────────────────

async function fetchSanity() {
  const client = getSanityClient()
  const [events, services, credentials, press] = await Promise.all([
    client.fetch<number>('count(*[_type == "event"])'),
    client.fetch<number>('count(*[_type == "service"])'),
    client.fetch<number>('count(*[_type == "credential"])'),
    client.fetch<number>('count(*[_type == "pressItem"])'),
  ])
  return { events, services, credentials, press }
}

// ── Email (Supabase messages table) ──────────────────────────────────────────

async function fetchEmails() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [{ count: sentThisMonth }, { count: totalSent }, { count: pendingDrafts }] = await Promise.all([
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('direction', 'outbound').gte('sent_at', startOfMonth),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('direction', 'outbound'),
    supabase.from('drafts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  return { sentThisMonth: sentThisMonth ?? 0, totalSent: totalSent ?? 0, pendingDrafts: pendingDrafts ?? 0 }
}

// ── Route ────────────────────────────────────────────────────────────────────

export async function GET() {
  const [vercel, ga4, sanity, emails] = await Promise.allSettled([
    fetchVercel(),
    fetchGA4(),
    fetchSanity(),
    fetchEmails(),
  ])

  return NextResponse.json({
    vercel: vercel.status === 'fulfilled' ? vercel.value : null,
    ga4: ga4.status === 'fulfilled' ? ga4.value : null,
    sanity: sanity.status === 'fulfilled' ? sanity.value : null,
    emails: emails.status === 'fulfilled' ? emails.value : null,
  })
}
