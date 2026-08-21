import { inngest } from '../client'
import { createServiceClient } from '@/lib/supabase/server'
import { getAnthropicClient, updateMonthlySpend } from '@/lib/anthropic'
import { REPLY_PROMPT } from '@/lib/admin-prompts'
import { sendDraftNotification } from '@/lib/discord'
import { sendPushIfEnabled } from '@/lib/push'

const MODEL = 'claude-sonnet-4-6'

export const handleInboundEmail = inngest.createFunction(
  { id: 'handle-inbound-email', triggers: [{ event: 'email/inbound.received' }] },
  async ({ event }: { event: { data: { leadId: string; from: string; subject: string; body: string; gmailMessageId: string; gmailThreadId?: string; rfcMessageId?: string } } }) => {
    const { leadId, subject, body, gmailMessageId, gmailThreadId, rfcMessageId } = event.data
    const supabase = await createServiceClient()

    // Step 1: Save inbound message
    const now = new Date().toISOString()
    await supabase.from('messages').insert({
      lead_id: leadId,
      direction: 'inbound',
      channel: 'email',
      subject,
      body,
      sent_at: now,
      gmail_message_id: gmailMessageId,
      gmail_thread_id: gmailThreadId,
      rfc_message_id: rfcMessageId,
    })

    // Step 2: Load context
    const [{ data: lead }, { data: history }, { data: enrichment }] = await Promise.all([
      supabase.from('leads').select('*').eq('id', leadId).single(),
      supabase.from('messages')
        .select('direction, subject, body, sent_at')
        .eq('lead_id', leadId)
        .order('sent_at', { ascending: true })
        .limit(8),
      supabase.from('enrichment')
        .select('research_brief')
        .eq('lead_id', leadId)
        .eq('provider', 'claude')
        .maybeSingle(),
    ])

    if (!lead) return { error: 'Lead not found' }

    const researchBrief = enrichment?.research_brief ?? 'No research available yet.'

    const { data: settingsRow } = await supabase
      .from('settings')
      .select('brand_voice_notes, voice_examples')
      .single()
    const voiceNotes = settingsRow?.brand_voice_notes ?? ''
    const voiceExamples = settingsRow?.voice_examples ?? ''

    const messageHistory = (history ?? []).map(m => ({
      direction: m.direction as string,
      subject: m.subject as string | null,
      body: (m.body as string).slice(0, 600),
    }))

    // Step 3: Generate reply draft
    const anthropic = await getAnthropicClient()
    if (!anthropic) return { error: 'Anthropic not configured' }

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: REPLY_PROMPT(lead, researchBrief, { subject, body }, messageHistory, voiceNotes, voiceExamples),
      }],
    })

    await updateMonthlySpend(response.usage.input_tokens, response.usage.output_tokens, 0, MODEL)

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    let parsed: { subject?: string; body?: string; reasoning?: string } = {}
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
    } catch { /* use raw */ }

    // Step 4: Save draft
    const { data: draft } = await supabase.from('drafts').insert({
      lead_id: leadId,
      channel: 'email',
      subject: parsed.subject ?? `Re: ${subject}`,
      body: parsed.body ?? text,
      reasoning: parsed.reasoning ?? '',
      status: 'pending',
      model: MODEL,
    }).select().single()

    if (!draft) return { error: 'Failed to save draft' }

    // Step 5: Create approval task
    const fitScore = typeof lead.fit_score === 'number' ? lead.fit_score : 0
    await supabase.from('tasks').insert({
      type: 'approve',
      priority: fitScore >= 70 ? 'hot' : 'warm',
      lead_id: leadId,
      draft_id: draft.id,
      title: `Reply to ${lead.name}`,
      description: `They replied: "${subject}"`,
    })

    // Step 6: Discord notification
    await sendDraftNotification(
      { id: draft.id, subject: draft.subject, body: draft.body, reasoning: draft.reasoning },
      { name: lead.name, organization: lead.organization },
      { subject, body: body.slice(0, 300) }
    )

    // Step 6b: Web push — same trigger as the Discord ping above.
    const isHot = fitScore >= 70
    await sendPushIfEnabled(isHot ? 'push_hot_replies' : 'push_new_drafts', {
      title: isHot ? `Hot reply from ${lead.name}` : `New draft ready: ${lead.name}`,
      body: draft.subject ?? subject,
      url: `/admin/drafts/${draft.id}`,
    })

    // Step 7: Activity log
    await supabase.from('activity_log').insert({
      lead_id: leadId,
      action: 'inbound_email_received',
      actor: 'ai',
      detail_json: { draftId: draft.id, inboundSubject: subject, model: MODEL },
    })

    return { draftId: draft.id, leadId }
  }
)
