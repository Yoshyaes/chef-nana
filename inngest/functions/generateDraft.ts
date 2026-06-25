import { inngest } from '../client'
import { getAnthropicClient, updateMonthlySpend } from '@/lib/anthropic'
import { DRAFT_PROMPT } from '@/lib/admin-prompts'
import { createServiceClient } from '@/lib/supabase/server'

const MODEL = 'claude-sonnet-4-6'

export const generateDraft = inngest.createFunction(
  { id: 'generate-draft', triggers: [{ event: 'draft/generate.requested' }] },
  async ({ event }: { event: { data: { leadId: string; step?: number } } }) => {
    const { leadId, step = 1 } = event.data
    const supabase = await createServiceClient()

    const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single()
    if (!lead) return { error: 'Lead not found' }

    const { data: enrichment } = await supabase
      .from('enrichment')
      .select('research_brief, structured_json')
      .eq('lead_id', leadId)
      .eq('provider', 'claude')
      .maybeSingle()

    const researchBrief = enrichment?.research_brief ?? 'No research available yet.'

    const { data: settingsRow } = await supabase
      .from('settings')
      .select('brand_voice_notes, voice_examples')
      .single()
    const voiceNotes = settingsRow?.brand_voice_notes ?? ''
    const voiceExamples = settingsRow?.voice_examples ?? ''

    const anthropic = await getAnthropicClient()
    if (!anthropic) return { error: 'Anthropic not configured' }

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: DRAFT_PROMPT(lead, researchBrief, step, voiceNotes, voiceExamples) }],
    })

    await updateMonthlySpend(response.usage.input_tokens, response.usage.output_tokens, 0, MODEL)

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    let parsed: { subject?: string; body?: string; reasoning?: string } = {}
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
    } catch { /* use raw */ }

    const { data: draft } = await supabase.from('drafts').insert({
      lead_id: leadId,
      channel: 'email',
      subject: parsed.subject ?? 'A note from Nana Wilmot',
      body: parsed.body ?? text,
      reasoning: parsed.reasoning ?? '',
      status: 'pending',
      model: MODEL,
    }).select().single()

    const fitScore = typeof lead.fit_score === 'number' ? lead.fit_score : 0
    await supabase.from('tasks').insert({
      type: 'approve',
      priority: fitScore >= 80 ? 'hot' : 'warm',
      lead_id: leadId,
      draft_id: draft?.id,
      title: `Approve outreach to ${lead.name}`,
      description: `Step ${step} draft ready for your review`,
    })

    await supabase.from('activity_log').insert({
      lead_id: leadId,
      action: 'draft_created',
      actor: 'ai',
      detail_json: { draftId: draft?.id, step, model: MODEL },
    })

    return { draftId: draft?.id }
  }
)
