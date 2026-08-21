import { Resend } from 'resend'
import { createServiceClient } from './supabase/server'
import { getGmailAccessToken, sendGmailReply } from './gmail'

type ApproveResult =
  | { sent: true; messageId: string; provider: 'gmail' | 'resend'; leadName: string }
  | { error: string }

export async function approveDraft(draftId: string): Promise<ApproveResult> {
  const supabase = await createServiceClient()

  const { data: draft } = await supabase
    .from('drafts')
    .select('*, leads(name, email, organization)')
    .eq('id', draftId)
    .single()

  if (!draft) return { error: 'Draft not found' }
  if (draft.status === 'sent') return { error: 'Already sent' }

  const lead = draft.leads as { name: string; email: string; organization: string }
  if (!lead?.email) return { error: 'Lead has no email address' }

  const { data: suppressed } = await supabase
    .from('suppression_list')
    .select('id')
    .eq('email', lead.email)
    .maybeSingle()

  if (suppressed) return { error: 'Email is on suppression list' }

  const { data: settings } = await supabase
    .from('settings')
    .select('sending_domain, gmail_refresh_token')
    .single()

  let provider: 'gmail' | 'resend'
  let sentId: string

  if (settings?.gmail_refresh_token) {
    // Reply through the connected georginasfoods@gmail.com account, threaded into the
    // customer's original conversation — see the most recent inbound message for this
    // lead for the Gmail thread/Message-ID to reply into.
    const { data: lastInbound } = await supabase
      .from('messages')
      .select('gmail_thread_id, rfc_message_id')
      .eq('lead_id', draft.lead_id)
      .eq('direction', 'inbound')
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    try {
      const accessToken = await getGmailAccessToken(settings.gmail_refresh_token)
      const sent = await sendGmailReply(accessToken, {
        to: lead.email,
        subject: draft.subject ?? 'A note from Nana Wilmot',
        bodyText: draft.body,
        threadId: lastInbound?.gmail_thread_id ?? undefined,
        inReplyToRfcId: lastInbound?.rfc_message_id ?? undefined,
      })
      provider = 'gmail'
      sentId = sent.id
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Gmail send failed' }
    }
  } else {
    const sendingDomain = settings?.sending_domain ?? 'mail.chefnanawilmot.com'
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data: sent, error: sendError } = await resend.emails.send({
      from: `Nana Wilmot <nana@${sendingDomain}>`,
      to: lead.email,
      subject: draft.subject ?? 'A note from Nana Wilmot',
      text: draft.body,
    })

    if (sendError) return { error: sendError.message }
    provider = 'resend'
    sentId = sent?.id ?? ''
  }

  const now = new Date().toISOString()

  await Promise.all([
    supabase.from('drafts').update({ status: 'sent', approved_at: now, sent_at: now }).eq('id', draftId),
    supabase.from('messages').insert({
      lead_id: draft.lead_id,
      direction: 'outbound',
      channel: 'email',
      subject: draft.subject,
      body: draft.body,
      sent_at: now,
      resend_message_id: provider === 'resend' ? sentId : null,
      gmail_message_id: provider === 'gmail' ? sentId : null,
    }),
    supabase.from('activity_log').insert({
      lead_id: draft.lead_id,
      action: 'email_sent',
      actor: 'nana',
      detail_json: { draftId, provider, messageId: sentId, to: lead.email },
    }),
    supabase.from('tasks').update({ status: 'done' }).eq('draft_id', draftId),
    supabase.from('leads').update({ stage: 'contacted', updated_at: now }).eq('id', draft.lead_id).eq('stage', 'sourced'),
  ])

  return { sent: true, messageId: sentId, provider, leadName: lead.name }
}
