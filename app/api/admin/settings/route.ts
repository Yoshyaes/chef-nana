import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('settings')
    .select('monthly_budget_cap, current_month_spend, brand_voice_notes, approve_before_sending, sending_domain')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mask API keys — show only whether they're set
  const { data: full } = await supabase.from('settings').select('anthropic_api_key_encrypted, apollo_api_key_encrypted').single()
  return NextResponse.json({
    ...data,
    anthropicKeySet: !!full?.anthropic_api_key_encrypted,
    apolloKeySet: !!full?.apollo_api_key_encrypted,
  })
}

export async function PUT(req: NextRequest) {
  const supabase = await createServiceClient()
  const body = await req.json()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.monthly_budget_cap !== undefined) updates.monthly_budget_cap = body.monthly_budget_cap
  if (body.brand_voice_notes !== undefined) updates.brand_voice_notes = body.brand_voice_notes
  if (body.approve_before_sending !== undefined) updates.approve_before_sending = body.approve_before_sending
  if (body.sending_domain !== undefined) updates.sending_domain = body.sending_domain
  if (body.anthropic_api_key !== undefined) updates.anthropic_api_key_encrypted = body.anthropic_api_key
  if (body.apollo_api_key !== undefined) updates.apollo_api_key_encrypted = body.apollo_api_key

  const { data, error } = await supabase.from('settings').update(updates).neq('id', '00000000-0000-0000-0000-000000000000').select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
