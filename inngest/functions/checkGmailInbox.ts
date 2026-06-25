import { inngest } from '../client'
import { createServiceClient } from '@/lib/supabase/server'
import { getGmailAccessToken, fetchNewMessageIds, fetchGmailMessage } from '@/lib/gmail'

export const checkGmailInbox = inngest.createFunction(
  {
    id: 'check-gmail-inbox',
    triggers: [{ cron: '*/10 * * * *' }],
    concurrency: { limit: 1 },
  },
  async () => {
    const supabase = await createServiceClient()

    const { data: settings } = await supabase
      .from('settings')
      .select('gmail_refresh_token, gmail_history_id')
      .single()

    if (!settings?.gmail_refresh_token) return { skipped: 'Gmail not connected' }
    if (!settings.gmail_history_id) return { skipped: 'No history ID — reconnect Gmail' }

    const accessToken = await getGmailAccessToken(settings.gmail_refresh_token)
    const { messageIds, newHistoryId } = await fetchNewMessageIds(accessToken, settings.gmail_history_id)

    if (messageIds.length === 0) {
      await supabase.from('settings').update({ gmail_history_id: newHistoryId }).neq('id', '00000000-0000-0000-0000-000000000000')
      return { processed: 0 }
    }

    let matched = 0

    for (const messageId of messageIds) {
      const message = await fetchGmailMessage(accessToken, messageId)
      if (!message) continue

      // Skip messages sent from the same domain (outbound copies landing in inbox)
      if (message.from.endsWith('@mail.chefnanawilmot.com') || message.from === 'georginasfoods@gmail.com') continue

      const { data: lead } = await supabase
        .from('leads')
        .select('id, name')
        .eq('email', message.from)
        .maybeSingle()

      if (!lead) continue

      // Avoid duplicate processing
      const { data: existing } = await supabase
        .from('messages')
        .select('id')
        .eq('lead_id', lead.id)
        .eq('direction', 'inbound')
        .like('body', message.body.slice(0, 80) + '%')
        .maybeSingle()

      if (existing) continue

      await inngest.send({
        name: 'email/inbound.received',
        data: {
          leadId: lead.id,
          from: message.from,
          subject: message.subject,
          body: message.body,
          gmailMessageId: message.id,
        },
      })

      matched++
    }

    await supabase
      .from('settings')
      .update({ gmail_history_id: newHistoryId })
      .neq('id', '00000000-0000-0000-0000-000000000000')

    return { processed: matched, total: messageIds.length }
  }
)
