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

export function buildDraftEmbed(
  draft: Draft,
  lead: Lead,
  opts?: { inbound?: InboundContext; edited?: boolean }
): { embed: Record<string, unknown>; components: Record<string, unknown>[] } {
  const bodyPreview = draft.body.slice(0, 400) + (draft.body.length > 400 ? '…' : '')
  const isReply = !!opts?.inbound

  const description = opts?.inbound
    ? `**Incoming message:** ${opts.inbound.subject}\n\n**Proposed reply:**\n${bodyPreview}`
    : bodyPreview

  const embed = {
    title: opts?.edited
      ? `✏ Draft updated — ${lead.name}`
      : isReply
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

  const components = [
    {
      type: 1,
      components: [
        { type: 2, style: 3, label: 'Approve ✓', custom_id: `approve_draft_${draft.id}` },
        { type: 2, style: 4, label: 'Reject ✗', custom_id: `reject_draft_${draft.id}` },
        { type: 2, style: 2, label: 'Edit ✎', custom_id: `edit_draft_${draft.id}` },
      ],
    },
    {
      type: 1,
      components: [
        { type: 2, style: 2, label: 'Coach 🎓', custom_id: `coach_draft_${draft.id}` },
        { type: 2, style: 5, label: 'View in Admin →', url: `https://chefnanawilmot.com/admin/drafts/${draft.id}` },
      ],
    },
  ]

  return { embed, components }
}

// Pings ring a device even when the channel is muted; a plain embed does not.
// Read at call time (not module load) so tests can set env vars per-case.
function draftMentionContent(): { content?: string; allowed_mentions?: { users: string[] } } {
  const ids = [process.env.DISCORD_NANA_USER_ID, process.env.DISCORD_JULIAN_USER_ID].filter(
    (id): id is string => !!id
  )
  if (!ids.length) return {}
  return { content: ids.map(id => `<@${id}>`).join(' '), allowed_mentions: { users: ids } }
}

export async function sendDraftNotification(
  draft: Draft,
  lead: Lead,
  inbound?: InboundContext
): Promise<string | null> {
  const token = process.env.DISCORD_BOT_TOKEN
  const channelId = process.env.DISCORD_CHANNEL_ID
  if (!token || !channelId) return null

  const { embed, components } = buildDraftEmbed(draft, lead, { inbound })

  const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...draftMentionContent(), embeds: [embed], components }),
  })

  if (!res.ok) {
    console.error('Discord sendDraftNotification failed:', await res.text())
    return null
  }
  const data = await res.json()
  return (data.id ?? null) as string | null
}

// Collapse the original message to a plain-text confirmation — used for terminal
// actions (approve/reject) where there's nothing left to act on.
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

// Re-render the original message with an updated embed — used after an edit, so the
// draft stays actionable (Approve/Reject/Edit/Coach remain clickable).
export async function updateInteractionEmbed(
  applicationId: string,
  interactionToken: string,
  embed: Record<string, unknown>,
  components: Record<string, unknown>[]
): Promise<void> {
  await fetch(
    `${DISCORD_API}/webhooks/${applicationId}/${interactionToken}/messages/@original`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed], components }),
    }
  )
}

// Appends a dated coaching note and trims from the oldest end so the notes block
// (which gets injected into every future draft/reply prompt) can't grow unbounded.
export function appendVoiceNote(existing: string | null | undefined, note: string, maxLen = 3000): string {
  const stamp = new Date().toISOString().slice(0, 10)
  const lines = (existing ?? '').split('\n').filter(Boolean)
  lines.push(`- [${stamp}] ${note}`)
  while (lines.join('\n').length > maxLen && lines.length > 1) lines.shift()
  return lines.join('\n')
}
