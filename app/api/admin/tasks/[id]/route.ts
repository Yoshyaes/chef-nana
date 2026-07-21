import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/supabase/currentUser'

const PATCHABLE_FIELDS = ['title', 'notes', 'status', 'priority', 'owner_id', 'due_date', 'lead_id', 'menu_id']

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('team_tasks')
    .select('*, lead:leads(id, name), menu:menus(id, title)')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of PATCHABLE_FIELDS) {
    if (key in body) updates[key] = body[key]
  }
  if (updates.status === 'done') updates.completed_at = new Date().toISOString()
  if (updates.status && updates.status !== 'done') updates.completed_at = null

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('team_tasks')
    .update(updates)
    .eq('id', id)
    .select('*, lead:leads(id, name), menu:menus(id, title)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { error } = await supabase.from('team_tasks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
