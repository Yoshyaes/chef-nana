import { inngest } from '../client'
import { getAnthropicClient, updateMonthlySpend } from '@/lib/anthropic'
import { TRIAGE_PROMPT } from '@/lib/admin-prompts'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushIfEnabled } from '@/lib/push'

const MODEL = 'claude-haiku-4-5-20251001'

export const dailyTriage = inngest.createFunction(
  {
    id: 'daily-triage',
    concurrency: 1,
    triggers: [
      { cron: '0 11 * * *' }, // 7am ET = 11am UTC
      { event: 'triage/generate.requested' },
    ],
  },
  async () => {
    const supabase = await createServiceClient()

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*, leads(name, organization, fit_score, est_annual_value, stage)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20)

    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .neq('stage', 'lost')

    const { count: hotReplies } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'reply')
      .eq('priority', 'hot')
      .eq('status', 'pending')

    const { count: draftsToApprove } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'approve')
      .eq('status', 'pending')

    const { count: followUpsDue } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'followup')
      .eq('status', 'pending')

    const stats = {
      hotReplies: hotReplies ?? 0,
      draftsToApprove: draftsToApprove ?? 0,
      followUpsDue: followUpsDue ?? 0,
      activeLeads: totalLeads ?? 0,
    }

    if (!tasks?.length && stats.activeLeads === 0) {
      return { skipped: true, reason: 'No tasks or leads yet' }
    }

    const anthropic = await getAnthropicClient()
    if (!anthropic) return { error: 'Anthropic not configured' }

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: 'user', content: TRIAGE_PROMPT(tasks ?? [], stats) }],
    })

    await updateMonthlySpend(response.usage.input_tokens, response.usage.output_tokens, 0, MODEL)

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    let parsed: { tldr?: string; actions?: unknown[] } | null = null
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const candidate = JSON.parse(jsonMatch[0])
        if (typeof candidate.tldr === 'string') parsed = candidate
      }
    } catch { /* handled below */ }

    if (response.stop_reason === 'max_tokens' || !parsed) {
      console.error('dailyTriage: failed to produce a usable brief', {
        stopReason: response.stop_reason,
        textPreview: text.slice(0, 500),
      })
      return { stats, triageGenerated: false, error: 'Model response was truncated or unparsable' }
    }

    await supabase.from('settings').update({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      latest_triage: { tldr: parsed.tldr, actions: parsed.actions ?? [], stats, generated_at: new Date().toISOString() } as any,
      updated_at: new Date().toISOString(),
    }).neq('id', '00000000-0000-0000-0000-000000000000')

    await sendPushIfEnabled('push_brief_ready', {
      title: 'Your brief is ready',
      body: `${stats.draftsToApprove} draft${stats.draftsToApprove !== 1 ? 's' : ''} to approve`,
      url: '/admin/today',
    })

    return { stats, triageGenerated: true }
  }
)
