import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getGmailAccessToken, getGmailHistoryId } from '@/lib/gmail'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/admin/settings?gmailError=denied', request.url))
  }

  const clientId = process.env.GMAIL_CLIENT_ID!
  const clientSecret = process.env.GMAIL_CLIENT_SECRET!
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://chefnanawilmot.com'}/api/admin/gmail/callback`

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json()

  if (!tokens.refresh_token) {
    return NextResponse.redirect(new URL('/admin/settings?gmailError=no_refresh_token', request.url))
  }

  // Get initial history ID so we don't process old messages
  let historyId = ''
  try {
    historyId = await getGmailHistoryId(tokens.access_token)
  } catch { /* non-fatal — will be set on first poll */ }

  const supabase = await createServiceClient()
  await supabase
    .from('settings')
    .update({
      gmail_refresh_token: tokens.refresh_token,
      gmail_history_id: historyId,
      gmail_connected_at: new Date().toISOString(),
    })
    .neq('id', '00000000-0000-0000-0000-000000000000')

  return NextResponse.redirect(new URL('/admin/settings?gmailConnected=1', request.url))
}
