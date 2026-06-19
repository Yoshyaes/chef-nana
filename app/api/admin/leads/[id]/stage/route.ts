import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { stage } = await req.json()
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('leads')
    .update({ stage, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('activity_log').insert({
    lead_id: id,
    action: 'stage_changed',
    actor: 'nana',
    detail_json: { stage },
  })

  return NextResponse.json(data)
}
