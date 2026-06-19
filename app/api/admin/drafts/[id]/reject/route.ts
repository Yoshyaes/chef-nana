import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('drafts')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('lead_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('tasks').update({ status: 'done' }).eq('draft_id', id)
  await supabase.from('activity_log').insert({
    lead_id: data.lead_id,
    action: 'draft_rejected',
    actor: 'nana',
    detail_json: { draftId: id },
  })

  return NextResponse.json({ rejected: true })
}
