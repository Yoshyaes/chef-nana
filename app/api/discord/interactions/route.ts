import { NextRequest, NextResponse } from 'next/server'
import nacl from 'tweetnacl'
import { inngest } from '@/inngest/client'

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

function verifyDiscordSignature(
  publicKey: string,
  signature: string,
  timestamp: string,
  rawBody: string
): boolean {
  try {
    return nacl.sign.detached.verify(
      Buffer.from(timestamp + rawBody),
      hexToBytes(signature),
      hexToBytes(publicKey)
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

  const valid = verifyDiscordSignature(publicKey, signature, timestamp, rawBody)
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

    const deferred = NextResponse.json({ type: 6 })

    inngest.send({
      name: 'discord/interaction.received',
      data: { customId, applicationId, interactionToken },
    }).catch(() => { /* fire-and-forget */ })

    return deferred
  }

  return NextResponse.json({ type: 1 })
}
