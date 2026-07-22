import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const NOT_CONFIGURED = {
  monthly_budget_cap: 25,
  current_month_spend: 0,
  brand_voice_notes: '',
  approve_before_sending: true,
  sending_domain: 'mail.chefnanawilmot.com',
  anthropicKeySet: false,
  apolloKeySet: false,
  push_new_drafts: true,
  push_hot_replies: true,
  push_brief_ready: true,
  notConfigured: true,
}

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(NOT_CONFIGURED)
  }

  let supabase: Awaited<ReturnType<typeof createServiceClient>>
  try { supabase = await createServiceClient() } catch { return NextResponse.json(NOT_CONFIGURED) }

  const { data, error } = await supabase
    .from('settings')
    .select('monthly_budget_cap, current_month_spend, brand_voice_notes, voice_examples, approve_before_sending, sending_domain, push_new_drafts, push_hot_replies, push_brief_ready')
    .single()

  if (error) return NextResponse.json(NOT_CONFIGURED)

  const { data: full } = await supabase
    .from('settings')
    .select('anthropic_api_key_encrypted, apollo_api_key_encrypted, gmail_refresh_token, gmail_connected_at')
    .single()

  return NextResponse.json({
    ...data,
    anthropicKeySet: !!full?.anthropic_api_key_encrypted,
    apolloKeySet: !!full?.apollo_api_key_encrypted,
    gmailConnected: !!full?.gmail_refresh_token,
    gmailConnectedAt: full?.gmail_connected_at ?? null,
    discordConfigured: !!(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_CHANNEL_ID),
    pushConfigured: !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
  })
}

export async function PUT(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }
  const supabase = await createServiceClient()
  const body = await req.json()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.monthly_budget_cap !== undefined) updates.monthly_budget_cap = body.monthly_budget_cap
  if (body.brand_voice_notes !== undefined) updates.brand_voice_notes = body.brand_voice_notes
  if (body.voice_examples !== undefined) updates.voice_examples = body.voice_examples
  if (body.approve_before_sending !== undefined) updates.approve_before_sending = body.approve_before_sending
  if (body.sending_domain !== undefined) updates.sending_domain = body.sending_domain
  if (body.anthropic_api_key !== undefined) updates.anthropic_api_key_encrypted = body.anthropic_api_key
  if (body.apollo_api_key !== undefined) updates.apollo_api_key_encrypted = body.apollo_api_key
  if (body.push_new_drafts !== undefined) updates.push_new_drafts = body.push_new_drafts
  if (body.push_hot_replies !== undefined) updates.push_hot_replies = body.push_hot_replies
  if (body.push_brief_ready !== undefined) updates.push_brief_ready = body.push_brief_ready

  const { data, error } = await supabase.from('settings').update(updates).neq('id', '00000000-0000-0000-0000-000000000000').select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
