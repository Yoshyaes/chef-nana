import { inngest } from '../client'
import { approveDraft } from '@/lib/approveDraft'
import { updateInteractionMessage, updateInteractionEmbed, buildDraftEmbed } from '@/lib/discord'
import { createServiceClient } from '@/lib/supabase/server'

export const handleDiscordInteraction = inngest.createFunction(
  { id: 'handle-discord-interaction', triggers: [{ event: 'discord/interaction.received' }] },
  async ({ event }: { event: { data: { customId: string; applicationId: string; interactionToken: string; discordUser?: string; modalFields?: Record<string, string> } } }) => {
    const { customId, applicationId, interactionToken, discordUser = 'Nana', modalFields } = event.data

    if (customId.startsWith('edit_modal_')) {
      const draftId = customId.replace('edit_modal_', '')
      const subject = (modalFields?.subject ?? '').trim()
      const body = (modalFields?.body ?? '').trim()
      const supabase = await createServiceClient()

      const { data: draft } = await supabase
        .from('drafts')
        .update({ subject, body, status: 'edited', updated_at: new Date().toISOString() })
        .eq('id', draftId)
        .select('*, leads(name, organization)')
        .single()

      if (!draft) {
        await updateInteractionMessage(applicationId, interactionToken, "❌ Couldn't save — draft not found.")
        return { error: 'Draft not found' }
      }

      await supabase.from('activity_log').insert({
        lead_id: draft.lead_id,
        action: 'draft_edited',
        actor: discordUser,
        detail_json: { draftId, source: 'discord' },
      })

      const lead = draft.leads as { name: string; organization: string | null } | null
      const { embed, components } = buildDraftEmbed(
        { id: draftId, subject: draft.subject, body: draft.body, reasoning: draft.reasoning },
        { name: lead?.name ?? 'Lead', organization: lead?.organization ?? null },
        { edited: true }
      )
      await updateInteractionEmbed(applicationId, interactionToken, embed, components)
      return { edited: true }
    }

    if (customId.startsWith('approve_draft_')) {
      const draftId = customId.replace('approve_draft_', '')
      const result = await approveDraft(draftId)

      if ('error' in result) {
        await updateInteractionMessage(applicationId, interactionToken, `❌ ${result.error}`)
        return { error: result.error }
      }

      await updateInteractionMessage(
        applicationId,
        interactionToken,
        `✅ Sent to **${result.leadName}**`
      )
      return { sent: true, messageId: result.messageId, provider: result.provider }
    }

    if (customId.startsWith('reject_draft_')) {
      const draftId = customId.replace('reject_draft_', '')
      const supabase = await createServiceClient()

      const { data: draft } = await supabase
        .from('drafts')
        .select('lead_id, leads(name)')
        .eq('id', draftId)
        .single()

      await supabase.from('drafts').update({ status: 'rejected' }).eq('id', draftId)

      if (draft) {
        await supabase.from('activity_log').insert({
          lead_id: draft.lead_id,
          action: 'draft_rejected',
          actor: 'nana',
          detail_json: { draftId, source: 'discord' },
        })
      }

      const leadName = ((draft?.leads as unknown) as { name: string } | null)?.name ?? 'lead'
      await updateInteractionMessage(applicationId, interactionToken, `✗ Draft for **${leadName}** rejected by **${discordUser}**`)
      return { rejected: true }
    }

    return { error: `Unknown customId: ${customId}` }
  }
)
