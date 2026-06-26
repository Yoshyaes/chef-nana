import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const leadId = searchParams.get('leadId')
  if (!leadId) return NextResponse.json([])

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('messages')
    .select('id, direction, channel, subject, body, sent_at')
    .eq('lead_id', leadId)
    .order('sent_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
