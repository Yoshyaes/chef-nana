import { inngest } from '../client'
import { getAnthropicClient, updateMonthlySpend } from '@/lib/anthropic'
import { enrichContact } from '@/lib/apollo'
import { RESEARCH_PROMPT } from '@/lib/admin-prompts'
import { createServiceClient } from '@/lib/supabase/server'

const MODEL = 'claude-sonnet-4-6'

export const researchLead = inngest.createFunction(
  { id: 'research-lead', triggers: [{ event: 'lead/research.requested' }] },
  async ({ event }: { event: { data: { leadId: string } } }) => {
    const { leadId } = event.data
    const supabase = await createServiceClient()

    const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single()
    if (!lead) return { error: 'Lead not found' }

    let enrichmentData: Record<string, unknown> = { ...lead }
    if (lead.email) {
      const apollo = await enrichContact(lead.email)
      if (apollo) {
        enrichmentData = { ...enrichmentData, apollo }
        await supabase.from('enrichment').insert({
          lead_id: leadId,
          raw_json: apollo,
          structured_json: apollo,
          provider: 'apollo',
        })
      }
    }

    const anthropic = await getAnthropicClient()
    if (!anthropic) return { error: 'Anthropic not configured' }

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: RESEARCH_PROMPT(enrichmentData) }],
    })

    await updateMonthlySpend(response.usage.input_tokens, response.usage.output_tokens, 0, MODEL)

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    let parsed: Record<string, unknown> = {}
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
    } catch { /* use empty */ }

    await supabase.from('leads').update({
      fit_score: parsed.fitScore ?? null,
      est_annual_value: parsed.estimatedAnnualValue ?? null,
      is_recurring: parsed.recurringPotential ?? false,
      updated_at: new Date().toISOString(),
    }).eq('id', leadId)

    await supabase.from('enrichment').upsert({
      lead_id: leadId,
      research_brief: parsed.researchBrief ?? text,
      research_sources: parsed.sources ?? [],
      provider: 'claude',
      structured_json: parsed,
    }, { onConflict: 'lead_id,provider' })

    await supabase.from('activity_log').insert({
      lead_id: leadId,
      action: 'research_completed',
      actor: 'ai',
      detail_json: { fitScore: parsed.fitScore, model: MODEL },
    })

    const fitScore = typeof parsed.fitScore === 'number' ? parsed.fitScore : 0
    await supabase.from('tasks').insert({
      type: 'approve',
      priority: fitScore >= 80 ? 'hot' : 'warm',
      lead_id: leadId,
      title: `Draft outreach for ${lead.name}`,
      description: String(parsed.suggestedApproach ?? 'Research complete — ready to draft'),
    })

    return { leadId, fitScore: parsed.fitScore }
  }
)
