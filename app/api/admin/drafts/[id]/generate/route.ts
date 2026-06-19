import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { inngest } from '@/inngest/client'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { step = 1 } = await req.json()
  const supabase = await createServiceClient()

  const { data: draft } = await supabase.from('drafts').select('lead_id').eq('id', id).single()
  if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 })

  await inngest.send({
    name: 'draft/generate.requested',
    data: { leadId: draft.lead_id, step },
  })

  return NextResponse.json({ queued: true })
}
