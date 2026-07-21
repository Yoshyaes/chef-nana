import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/supabase/currentUser'

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const view = searchParams.get('view') ?? 'all'
  const owner = searchParams.get('owner')
  const status = searchParams.get('status')
  const showDone = searchParams.get('showDone') === 'true'
  const today = new Date().toISOString().slice(0, 10)

  const supabase = await createServiceClient()
  let query = supabase
    .from('team_tasks')
    .select('*, lead:leads(id, name), menu:menus(id, title)')
    .order('due_date', { ascending: true, nullsFirst: false })

  if (view === 'mine') query = query.eq('owner_id', userId)
  if (view === 'overdue') query = query.lt('due_date', today).neq('status', 'done')
  if (owner) query = query.eq('owner_id', owner)
  if (status) query = query.eq('status', status)
  if (!showDone && view !== 'overdue' && !status) query = query.neq('status', 'done')

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = await req.json()
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('team_tasks')
    .insert({
      title: body.title.trim(),
      notes: body.notes ?? null,
      priority: body.priority ?? 'medium',
      owner_id: body.owner_id || userId,
      created_by: userId,
      due_date: body.due_date || null,
      lead_id: body.lead_id ?? null,
      menu_id: body.menu_id ?? null,
    })
    .select('*, lead:leads(id, name), menu:menus(id, title)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
