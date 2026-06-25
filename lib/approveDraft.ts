import { Resend } from 'resend'
import { createServiceClient } from './supabase/server'

type ApproveResult =
  | { sent: true; resendId: string; leadName: string }
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

  const { data: settings } = await supabase.from('settings').select('sending_domain').single()
  const sendingDomain = settings?.sending_domain ?? 'mail.chefnanawilmot.com'

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { data: sent, error: sendError } = await resend.emails.send({
    from: `Nana Wilmot <nana@${sendingDomain}>`,
    to: lead.email,
    subject: draft.subject ?? 'A note from Nana Wilmot',
    text: draft.body,
  })

  if (sendError) return { error: sendError.message }

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
      resend_message_id: sent?.id,
    }),
    supabase.from('activity_log').insert({
      lead_id: draft.lead_id,
      action: 'email_sent',
      actor: 'nana',
      detail_json: { draftId, resendId: sent?.id, to: lead.email },
    }),
    supabase.from('tasks').update({ status: 'done' }).eq('draft_id', draftId),
    supabase.from('leads').update({ stage: 'contacted', updated_at: now }).eq('id', draft.lead_id).eq('stage', 'sourced'),
  ])

  return { sent: true, resendId: sent?.id ?? '', leadName: lead.name }
}
