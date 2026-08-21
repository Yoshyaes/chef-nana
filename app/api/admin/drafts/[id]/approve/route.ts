import { NextRequest, NextResponse } from 'next/server'
import { approveDraft } from '@/lib/approveDraft'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await approveDraft(id)
  if ('error' in result) {
    const status = result.error === 'Draft not found' ? 404
      : result.error === 'Already sent' ? 409
      : 400
    return NextResponse.json({ error: result.error }, { status })
  }
  return NextResponse.json({ sent: true, messageId: result.messageId, provider: result.provider })
}
