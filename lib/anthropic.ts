import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from './supabase/server'

export async function getAnthropicClient(): Promise<Anthropic | null> {
  try {
    const supabase = await createServiceClient()
    const { data } = await supabase
      .from('settings')
      .select('anthropic_api_key_encrypted')
      .single()

    if (!data?.anthropic_api_key_encrypted) return null

    return new Anthropic({ apiKey: data.anthropic_api_key_encrypted })
  } catch {
    return null
  }
}

export async function updateMonthlySpend(inputTokens: number, outputTokens: number, cacheReadTokens = 0, model: string) {
  try {
    // Pricing as of 2025 (per 1M tokens)
    const rates: Record<string, { input: number; output: number; cacheRead: number }> = {
      'claude-sonnet-4-6': { input: 3.0, output: 15.0, cacheRead: 0.3 },
      'claude-haiku-4-5-20251001': { input: 0.8, output: 4.0, cacheRead: 0.08 },
    }
    const rate = rates[model] ?? rates['claude-sonnet-4-6']
    const cost =
      (inputTokens / 1_000_000) * rate.input +
      (outputTokens / 1_000_000) * rate.output +
      (cacheReadTokens / 1_000_000) * rate.cacheRead

    const supabase = await createServiceClient()
    await supabase.rpc('increment_spend', { amount: cost })
  } catch {
    // Non-fatal
  }
}
