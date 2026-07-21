import type { createServiceClient } from '@/lib/supabase/server'

type ServiceClient = Awaited<ReturnType<typeof createServiceClient>>

export async function logTaskActivity(
  supabase: ServiceClient,
  taskId: string,
  actorId: string,
  action: string,
  detail?: Record<string, unknown>
) {
  await supabase.from('task_activity').insert({ task_id: taskId, actor_id: actorId, action, detail: detail ?? null })
}

export async function logTaskChanges(
  supabase: ServiceClient,
  taskId: string,
  actorId: string,
  before: Record<string, unknown>,
  updates: Record<string, unknown>
) {
  const events: { action: string; detail?: Record<string, unknown> }[] = []
  const editedFields: string[] = []

  for (const key of Object.keys(updates)) {
    if (key === 'updated_at' || key === 'completed_at') continue
    if (updates[key] === before[key]) continue

    if (key === 'owner_id') {
      events.push({ action: 'reassigned', detail: { from_owner: before.owner_id, to_owner: updates.owner_id } })
    } else if (key === 'status') {
      events.push({ action: 'status_changed', detail: { from: before.status, to: updates.status } })
    } else if (key === 'due_date') {
      events.push({ action: 'due_changed', detail: { from: before.due_date, to: updates.due_date } })
    } else {
      editedFields.push(key)
    }
  }

  if (editedFields.length > 0) events.push({ action: 'edited', detail: { fields: editedFields } })
  if (events.length === 0) return

  await supabase.from('task_activity').insert(
    events.map(e => ({ task_id: taskId, actor_id: actorId, action: e.action, detail: e.detail ?? null }))
  )
}
