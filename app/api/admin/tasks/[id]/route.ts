import { NextRequest, NextResponse, after } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/supabase/currentUser'
import { logTaskChanges } from '@/lib/tasks/activity'
import { sendTaskAssignedEmail } from '@/lib/email/taskNotifications'

const PATCHABLE_FIELDS = ['title', 'notes', 'status', 'priority', 'owner_id', 'due_date', 'lead_id', 'menu_id']

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceClient()

  const [{ data, error }, { data: comments }, { data: activity }] = await Promise.all([
    supabase.from('team_tasks').select('*, lead:leads(id, name), menu:menus(id, title)').eq('id', id).single(),
    supabase.from('task_comments').select('*').eq('task_id', id).order('created_at', { ascending: true }),
    supabase.from('task_activity').select('*').eq('task_id', id).order('created_at', { ascending: false }),
  ])

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ...data, comments: comments ?? [], activity: activity ?? [] })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const supabase = await createServiceClient()

  const { data: before } = await supabase.from('team_tasks').select('*').eq('id', id).single()
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of PATCHABLE_FIELDS) {
    if (key in body) updates[key] = body[key]
  }
  if (updates.status === 'done') updates.completed_at = new Date().toISOString()
  if (updates.status && updates.status !== 'done') updates.completed_at = null

  const { data, error } = await supabase
    .from('team_tasks')
    .update(updates)
    .eq('id', id)
    .select('*, lead:leads(id, name), menu:menus(id, title)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logTaskChanges(supabase, id, userId, before, updates)

  const reassigned = 'owner_id' in updates && updates.owner_id !== before.owner_id
  if (reassigned && updates.owner_id !== userId) {
    const { data: actor } = await supabase.from('profiles').select('full_name').eq('id', userId).single()
    after(() =>
      sendTaskAssignedEmail({
        taskId: data.id,
        title: data.title,
        notes: data.notes,
        dueDate: data.due_date,
        priority: data.priority,
        actorName: actor?.full_name ?? 'Someone',
        recipientId: updates.owner_id as string,
      }).catch(err => console.error('[task-email] reassignment failed', err))
    )
  }

  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { error } = await supabase.from('team_tasks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
