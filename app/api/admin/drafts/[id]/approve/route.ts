import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data: draft } = await supabase
    .from('drafts')
    .select('*, leads(name, email, organization)')
    .eq('id', id)
    .single()

  if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
  if (draft.status === 'sent') return NextResponse.json({ error: 'Already sent' }, { status: 409 })

  const lead = draft.leads as { name: string; email: string; organization: string }
  if (!lead?.email) return NextResponse.json({ error: 'Lead has no email address' }, { status: 400 })

  // Check suppression list
  const { data: suppressed } = await supabase
    .from('suppression_list')
    .select('id')
    .eq('email', lead.email)
    .maybeSingle()

  if (suppressed) return NextResponse.json({ error: 'Email is on suppression list' }, { status: 400 })

  // Get settings for sending domain
  const { data: settings } = await supabase.from('settings').select('sending_domain').single()
  const sendingDomain = settings?.sending_domain ?? 'mail.chefnanawilmot.com'

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { data: sent, error: sendError } = await resend.emails.send({
    from: `Nana Wilmot <nana@${sendingDomain}>`,
    to: lead.email,
    subject: draft.subject ?? 'A note from Nana Wilmot',
    text: draft.body,
  })

  if (sendError) return NextResponse.json({ error: sendError.message }, { status: 500 })

  const now = new Date().toISOString()

  await Promise.all([
    supabase.from('drafts').update({ status: 'sent', approved_at: now, sent_at: now }).eq('id', id),
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
      detail_json: { draftId: id, resendId: sent?.id, to: lead.email },
    }),
    supabase.from('tasks').update({ status: 'done' }).eq('draft_id', id),
    supabase.from('leads').update({ stage: 'contacted', updated_at: now }).eq('id', draft.lead_id).eq('stage', 'sourced'),
  ])

  return NextResponse.json({ sent: true, resendId: sent?.id })
}
