import { NextRequest, NextResponse } from 'next/server'
import { inngest } from '@/inngest/client'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await inngest.send({ name: 'lead/research.requested', data: { leadId: id } })
  return NextResponse.json({ queued: true })
}
