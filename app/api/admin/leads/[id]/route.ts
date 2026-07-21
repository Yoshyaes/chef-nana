import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceClient()

  const [{ data: lead }, { data: enrichment }, { data: messages }, { data: drafts }, { data: log }, { data: tasks }] =
    await Promise.all([
      supabase.from('leads').select('*').eq('id', id).single(),
      supabase.from('enrichment').select('*').eq('lead_id', id),
      supabase.from('messages').select('*').eq('lead_id', id).order('sent_at', { ascending: false }),
      supabase.from('drafts').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
      supabase.from('activity_log').select('*').eq('lead_id', id).order('created_at', { ascending: false }).limit(20),
      supabase.from('team_tasks').select('id, title, status, priority, due_date, owner_id').eq('lead_id', id).neq('status', 'done').order('due_date', { ascending: true, nullsFirst: false }),
    ])

  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ lead, enrichment, messages, drafts, log, tasks })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('leads')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceClient()

  // These tables were created directly against the live database with no guaranteed
  // FK cascade, so clean up dependent rows explicitly before removing the lead.
  await Promise.all([
    supabase.from('drafts').delete().eq('lead_id', id),
    supabase.from('messages').delete().eq('lead_id', id),
    supabase.from('tasks').delete().eq('lead_id', id),
    supabase.from('activity_log').delete().eq('lead_id', id),
    supabase.from('enrichment').delete().eq('lead_id', id),
  ])

  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
