import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.GMAIL_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'GMAIL_CLIENT_ID not configured' }, { status: 503 })
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.chefnanawilmot.com'}/api/admin/gmail/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send',
    access_type: 'offline',
    prompt: 'consent',
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}
