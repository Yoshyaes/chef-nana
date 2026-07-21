import { NextRequest, NextResponse, after } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/supabase/currentUser'
import { logTaskActivity } from '@/lib/tasks/activity'
import { sendTaskCommentEmail } from '@/lib/email/taskNotifications'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  if (!body.body || typeof body.body !== 'string' || !body.body.trim()) {
    return NextResponse.json({ error: 'Comment body is required' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  const { data: task } = await supabase.from('team_tasks').select('id, title, owner_id').eq('id', id).single()
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: comment, error } = await supabase
    .from('task_comments')
    .insert({ task_id: id, author_id: userId, body: body.body.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logTaskActivity(supabase, id, userId, 'commented')

  if (task.owner_id !== userId) {
    const { data: actor } = await supabase.from('profiles').select('full_name').eq('id', userId).single()
    after(() =>
      sendTaskCommentEmail({
        taskId: id,
        title: task.title,
        notes: null,
        dueDate: null,
        priority: '',
        actorName: actor?.full_name ?? 'Someone',
        recipientId: task.owner_id,
        commentBody: comment.body,
      }).catch(err => console.error('[task-email] comment failed', err))
    )
  }

  return NextResponse.json(comment, { status: 201 })
}
