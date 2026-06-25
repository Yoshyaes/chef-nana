const DISCORD_API = 'https://discord.com/api/v10'

interface Draft {
  id: string
  subject: string | null
  body: string
  reasoning: string | null
}

interface Lead {
  name: string
  organization: string | null
}

interface InboundContext {
  subject: string
  body: string
}

export async function sendDraftNotification(
  draft: Draft,
  lead: Lead,
  inbound?: InboundContext
): Promise<string | null> {
  const token = process.env.DISCORD_BOT_TOKEN
  const channelId = process.env.DISCORD_CHANNEL_ID
  if (!token || !channelId) return null

  const bodyPreview = draft.body.slice(0, 400) + (draft.body.length > 400 ? '…' : '')
  const isReply = !!inbound

  const description = isReply
    ? `**Incoming message:** ${inbound!.subject}\n\n**Proposed reply:**\n${bodyPreview}`
    : bodyPreview

  const embed = {
    title: isReply
      ? `↩ Reply ready — ${lead.name}`
      : `✉ Draft ready — ${lead.name}`,
    description,
    color: isReply ? 0xC9973A : 0x2D5F3D,
    fields: [
      { name: 'Organisation', value: lead.organization ?? '—', inline: true },
      { name: 'Subject', value: draft.subject ?? '(none)', inline: true },
      ...(draft.reasoning ? [{ name: 'Why this draft', value: draft.reasoning.slice(0, 200) }] : []),
    ],
    footer: { text: 'chefnanawilmot.com/admin' },
  }

  const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      embeds: [embed],
      components: [{
        type: 1,
        components: [
          { type: 2, style: 3, label: 'Approve ✓', custom_id: `approve_draft_${draft.id}` },
          { type: 2, style: 4, label: 'Reject ✗',  custom_id: `reject_draft_${draft.id}` },
          { type: 2, style: 5, label: 'View in Admin →', url: `https://chefnanawilmot.com/admin/drafts/${draft.id}` },
        ],
      }],
    }),
  })

  if (!res.ok) {
    console.error('Discord sendDraftNotification failed:', await res.text())
    return null
  }
  const data = await res.json()
  return (data.id ?? null) as string | null
}

// Update the original interaction message after approve/reject
// Uses the interaction token (not bot token) — no Authorization header needed for webhook API
export async function updateInteractionMessage(
  applicationId: string,
  interactionToken: string,
  content: string
): Promise<void> {
  await fetch(
    `${DISCORD_API}/webhooks/${applicationId}/${interactionToken}/messages/@original`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, embeds: [], components: [] }),
    }
  )
}
