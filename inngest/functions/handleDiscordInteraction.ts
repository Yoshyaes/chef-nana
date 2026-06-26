import { inngest } from '../client'
import { approveDraft } from '@/lib/approveDraft'
import { updateInteractionMessage } from '@/lib/discord'
import { createServiceClient } from '@/lib/supabase/server'

export const handleDiscordInteraction = inngest.createFunction(
  { id: 'handle-discord-interaction', triggers: [{ event: 'discord/interaction.received' }] },
  async ({ event }: { event: { data: { customId: string; applicationId: string; interactionToken: string; discordUser?: string } } }) => {
    const { customId, applicationId, interactionToken, discordUser = 'Nana' } = event.data

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
      return { sent: true, resendId: result.resendId }
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
