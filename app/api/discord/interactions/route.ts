import { NextRequest, NextResponse } from 'next/server'
import nacl from 'tweetnacl'
import { inngest } from '@/inngest/client'
import { createServiceClient } from '@/lib/supabase/server'
import { appendVoiceNote } from '@/lib/discord'

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

function textInputModal(
  customId: string,
  title: string,
  inputs: { customId: string; label: string; style: 1 | 2; value?: string; placeholder?: string; maxLength?: number }[]
) {
  return NextResponse.json({
    type: 9,
    data: {
      custom_id: customId,
      title,
      components: inputs.map(i => ({
        type: 1,
        components: [{
          type: 4,
          custom_id: i.customId,
          style: i.style,
          label: i.label,
          value: i.value,
          placeholder: i.placeholder,
          max_length: i.maxLength,
          required: true,
        }],
      })),
    },
  })
}

function extractModalFields(components: { components?: { custom_id?: string; value?: string }[] }[] | undefined): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const row of components ?? []) {
    for (const c of row.components ?? []) {
      if (c.custom_id) fields[c.custom_id] = c.value ?? ''
    }
  }
  return fields
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
    const discordUser: string =
      body.member?.user?.global_name ??
      body.member?.user?.username ??
      body.user?.global_name ??
      body.user?.username ??
      'Nana'

    // Edit and Coach open a modal, which Discord requires as the *direct* response
    // to the click — it can't be deferred and shown later like approve/reject.
    if (customId.startsWith('edit_draft_')) {
      const draftId = customId.replace('edit_draft_', '')
      const supabase = await createServiceClient()
      const { data: draft } = await supabase.from('drafts').select('subject, body').eq('id', draftId).single()
      if (!draft) {
        return NextResponse.json({ type: 4, data: { flags: 64, content: "Couldn't find that draft — it may have already been handled or deleted." } })
      }
      return textInputModal(`edit_modal_${draftId}`, 'Edit draft', [
        { customId: 'subject', label: 'Subject', style: 1, value: draft.subject ?? '', maxLength: 200 },
        { customId: 'body', label: 'Body', style: 2, value: draft.body ?? '', maxLength: 4000 },
      ])
    }

    if (customId.startsWith('coach_draft_')) {
      return textInputModal('coach_note', 'Teach the assistant', [
        {
          customId: 'note',
          label: 'What should it do differently?',
          style: 2,
          placeholder: "e.g. Don't mention pricing until they ask",
          maxLength: 300,
        },
      ])
    }

    const deferred = NextResponse.json({ type: 6 })

    inngest.send({
      name: 'discord/interaction.received',
      data: { customId, applicationId, interactionToken, discordUser },
    }).catch(() => { /* fire-and-forget */ })

    return deferred
  }

  // Modal submit
  if (body.type === 5) {
    const customId = body.data?.custom_id as string
    const fields = extractModalFields(body.data?.components)
    const applicationId = body.application_id as string
    const interactionToken = body.token as string
    const discordUser: string =
      body.member?.user?.global_name ??
      body.member?.user?.username ??
      body.user?.global_name ??
      body.user?.username ??
      'Nana'

    // Coach notes are a quick standing-instruction append — fast enough to do inline,
    // and there's no draft message to keep in sync, so no need to go through Inngest.
    if (customId === 'coach_note') {
      const note = (fields.note ?? '').trim()
      if (note) {
        const supabase = await createServiceClient()
        const { data: settingsRow } = await supabase.from('settings').select('brand_voice_notes').single()
        const updated = appendVoiceNote(settingsRow?.brand_voice_notes, note)
        await supabase.from('settings').update({ brand_voice_notes: updated, updated_at: new Date().toISOString() }).neq('id', '00000000-0000-0000-0000-000000000000')
      }
      return NextResponse.json({ type: 4, data: { flags: 64, content: '🎓 Got it — noted for future drafts and replies.' } })
    }

    if (customId.startsWith('edit_modal_')) {
      const draftId = customId.replace('edit_modal_', '')
      const deferred = NextResponse.json({ type: 6 })

      inngest.send({
        name: 'discord/interaction.received',
        data: { customId: `edit_modal_${draftId}`, applicationId, interactionToken, discordUser, modalFields: fields },
      }).catch(() => { /* fire-and-forget */ })

      return deferred
    }

    return NextResponse.json({ type: 6 })
  }

  return NextResponse.json({ type: 1 })
}
