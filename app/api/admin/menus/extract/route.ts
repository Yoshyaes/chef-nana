import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { inngest } from '@/inngest/client'

export async function POST(req: NextRequest) {
  const { photos } = await req.json()

  if (!Array.isArray(photos) || photos.length === 0) {
    return NextResponse.json({ error: 'No photos provided' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  const { data: extraction, error } = await supabase
    .from('menu_extractions')
    .insert({ photo_paths: photos, status: 'pending' })
    .select('id')
    .single()

  if (error || !extraction) {
    return NextResponse.json({ error: error?.message ?? 'Could not queue extraction' }, { status: 500 })
  }

  await inngest.send({
    name: 'menu/extract.requested',
    data: { extractionId: extraction.id, photos },
  })

  return NextResponse.json({ extractionId: extraction.id }, { status: 202 })
}
