import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Manual override from the admin dashboard (e.g. a guest lost their QR
// email). Distinct from POST /api/checkin, which is the passcode-gated door
// flow — this route inherits its auth from middleware.ts's Google-OAuth +
// profiles gate on /api/admin/:path*, not a passcode.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('attendees')
    .update({
      checked_in: body.checked_in,
      checked_in_at: body.checked_in ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
