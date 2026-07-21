import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getResend } from '@/lib/resend'

function taskUrl(taskId: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://chefnanawilmot.com'
  return `${base}/admin/tasks/${taskId}`
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: profiles } = await supabase.from('profiles').select('id, full_name')
  if (!profiles || profiles.length === 0) return NextResponse.json({ sent: 0 })

  const { data: settings } = await supabase.from('settings').select('sending_domain').single()
  const sendingDomain = settings?.sending_domain ?? 'mail.chefnanawilmot.com'
  const resend = getResend()

  let sent = 0

  for (const profile of profiles) {
    const { data: alreadySent } = await supabase
      .from('task_digest_log')
      .select('user_id')
      .eq('user_id', profile.id)
      .eq('sent_on', today)
      .maybeSingle()
    if (alreadySent) continue

    const { data: overdue } = await supabase
      .from('team_tasks')
      .select('id, title, due_date')
      .eq('owner_id', profile.id)
      .neq('status', 'done')
      .lt('due_date', today)
      .order('due_date', { ascending: true })

    const { data: dueToday } = await supabase
      .from('team_tasks')
      .select('id, title, due_date')
      .eq('owner_id', profile.id)
      .neq('status', 'done')
      .eq('due_date', today)

    const overdueList = overdue ?? []
    const dueTodayList = dueToday ?? []
    if (overdueList.length === 0 && dueTodayList.length === 0) continue

    const { data: { user } } = await supabase.auth.admin.getUserById(profile.id)
    if (!user?.email) continue

    const lines: string[] = []
    if (overdueList.length > 0) {
      lines.push('Overdue:')
      overdueList.forEach(t => lines.push(`- ${t.title} (${taskUrl(t.id)})`))
      lines.push('')
    }
    if (dueTodayList.length > 0) {
      lines.push('Due today:')
      dueTodayList.forEach(t => lines.push(`- ${t.title} (${taskUrl(t.id)})`))
    }

    const { error: sendError } = await resend.emails.send({
      from: `Lead Studio <tasks@${sendingDomain}>`,
      to: user.email,
      subject: `Your tasks: ${overdueList.length} overdue, ${dueTodayList.length} due today`,
      text: lines.join('\n'),
    })

    if (sendError) {
      console.error('[task-digest] send failed', profile.id, sendError)
      continue
    }

    await supabase.from('task_digest_log').insert({ user_id: profile.id, sent_on: today })
    sent++
  }

  return NextResponse.json({ sent })
}
