import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data: extraction, error } = await supabase
    .from('menu_extractions')
    .select('status, result, error')
    .eq('id', id)
    .single()

  if (error || !extraction) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(extraction)
}
