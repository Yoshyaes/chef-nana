import { NextRequest, NextResponse } from 'next/server'
import { inngest } from '@/inngest/client'

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2))
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

async function verifyDiscordSignature(
  publicKey: string,
  signature: string,
  timestamp: string,
  rawBody: string
): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      hexToBytes(publicKey),
      { name: 'Ed25519' },
      false,
      ['verify']
    )
    return crypto.subtle.verify(
      { name: 'Ed25519' },
      key,
      hexToBytes(signature),
      new TextEncoder().encode(timestamp + rawBody)
    )
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const publicKey = process.env.DISCORD_PUBLIC_KEY
  if (!publicKey) return NextResponse.json({ error: 'Discord not configured' }, { status: 503 })

  // Read raw body BEFORE any parsing (required for signature verification)
  const rawBody = await request.text()

  const signature = request.headers.get('x-signature-ed25519') ?? ''
  const timestamp = request.headers.get('x-signature-timestamp') ?? ''

  const valid = await verifyDiscordSignature(publicKey, signature, timestamp, rawBody)
  if (!valid) return new NextResponse('Invalid signature', { status: 401 })

  const body = JSON.parse(rawBody)

  // Discord PING — required to verify the endpoint in Discord Developer Portal
  if (body.type === 1) {
    return NextResponse.json({ type: 1 })
  }

  // Button click (MESSAGE_COMPONENT)
  if (body.type === 3) {
    const customId = body.data?.custom_id as string
    const applicationId = body.application_id as string
    const interactionToken = body.token as string

    // Respond immediately with DEFERRED_UPDATE_MESSAGE (type 6)
    // This prevents Discord's 3-second timeout while Inngest handles the actual work
    const deferred = NextResponse.json({ type: 6 })

    // Fire async Inngest job (non-blocking — response already prepared above)
    inngest.send({
      name: 'discord/interaction.received',
      data: { customId, applicationId, interactionToken },
    }).catch(() => { /* fire-and-forget */ })

    return deferred
  }

  return NextResponse.json({ type: 1 })
}
