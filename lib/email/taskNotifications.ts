import { getResend } from '@/lib/resend'
import { createServiceClient } from '@/lib/supabase/server'

interface TaskEmailContext {
  taskId: string
  title: string
  notes: string | null
  dueDate: string | null
  priority: string
  actorName: string
  recipientId: string
}

async function getSendingDomain(supabase: Awaited<ReturnType<typeof createServiceClient>>) {
  const { data: settings } = await supabase.from('settings').select('sending_domain').single()
  return settings?.sending_domain ?? 'mail.chefnanawilmot.com'
}

function taskUrl(taskId: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://chefnanawilmot.com'
  return `${base}/admin/tasks/${taskId}`
}

export async function sendTaskAssignedEmail(ctx: TaskEmailContext) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.admin.getUserById(ctx.recipientId)
  if (!user?.email) return

  const sendingDomain = await getSendingDomain(supabase)
  const resend = getResend()

  const lines = [
    `${ctx.actorName} assigned you a task.`,
    '',
    ctx.title,
    ctx.notes ?? '',
    ctx.dueDate ? `Due ${ctx.dueDate}` : 'No due date',
    `Priority: ${ctx.priority}`,
    '',
    taskUrl(ctx.taskId),
  ].filter(Boolean).join('\n')

  await resend.emails.send({
    from: `Lead Studio <tasks@${sendingDomain}>`,
    to: user.email,
    subject: `New task: ${ctx.title}`,
    text: lines,
  })
}

export async function sendTaskCommentEmail(ctx: TaskEmailContext & { commentBody: string }) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.admin.getUserById(ctx.recipientId)
  if (!user?.email) return

  const sendingDomain = await getSendingDomain(supabase)
  const resend = getResend()

  const lines = [
    `${ctx.actorName} commented on a task you own.`,
    '',
    ctx.title,
    '',
    `"${ctx.commentBody}"`,
    '',
    taskUrl(ctx.taskId),
  ].join('\n')

  await resend.emails.send({
    from: `Lead Studio <tasks@${sendingDomain}>`,
    to: user.email,
    subject: `New comment on: ${ctx.title}`,
    text: lines,
  })
}
