import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { inngest } from '@/inngest/client'

export async function GET() {
  const supabase = await createServiceClient()
  const { data: settings } = await supabase.from('settings').select('latest_triage').single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return NextResponse.json((settings as any)?.latest_triage ?? null)
}

export async function POST() {
  await inngest.send({ name: 'triage/generate.requested', data: {} })
  return NextResponse.json({ queued: true })
}
