import { NextResponse } from 'next/server'
import { sendDraftNotification } from '@/lib/discord'

export async function POST() {
  const fakeDraftId = '00000000-0000-0000-0000-000000000001'
  const messageId = await sendDraftNotification(
    {
      id: fakeDraftId,
      subject: 'Test notification from Georgina\'s Assistant',
      body: 'This is a test message to confirm your Discord bot is connected and posting to the right channel. If you can see this, everything is working correctly.',
      reasoning: 'This is a test notification triggered from the Settings page.',
    },
    { name: 'Test Lead', organization: 'Test Organization' },
  )

  if (!messageId) {
    return NextResponse.json({ ok: false, error: 'Failed to send — check DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID in Vercel' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, messageId })
}
