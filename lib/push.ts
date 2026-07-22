import webpush from 'web-push'
import { createServiceClient } from '@/lib/supabase/server'

export interface PushPayload {
  title: string
  body: string
  url?: string
}

function isConfigured() {
  return !!(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_SUBJECT
  )
}

let vapidConfigured = false
function ensureVapid() {
  if (vapidConfigured || !isConfigured()) return
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  vapidConfigured = true
}

// Sends to every registered device (team-wide, not user-targeted — see the
// push_subscriptions migration for why). Prunes subscriptions the push
// service reports as gone (404/410) rather than retrying them forever.
export async function sendPushToAllSubscribers(payload: PushPayload) {
  if (!isConfigured()) return { sent: 0, skipped: 'not_configured' as const }
  ensureVapid()

  const supabase = await createServiceClient()
  const { data: subs } = await supabase.from('push_subscriptions').select('id, endpoint, p256dh, auth')
  if (!subs?.length) return { sent: 0, skipped: 'no_subscribers' as const }

  const results = await Promise.allSettled(
    subs.map(async sub => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        )
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
        throw err
      }
    })
  )

  return { sent: results.filter(r => r.status === 'fulfilled').length, total: subs.length }
}

export async function sendPushIfEnabled(type: 'push_new_drafts' | 'push_hot_replies' | 'push_brief_ready', payload: PushPayload) {
  if (!isConfigured()) return
  const supabase = await createServiceClient()
  const { data: settings } = await supabase
    .from('settings')
    .select('push_new_drafts, push_hot_replies, push_brief_ready')
    .single()
  if (!settings?.[type]) return
  return sendPushToAllSubscribers(payload)
}
