import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getSignedMenuPhotoUrls } from '@/lib/supabase/storage'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data: menu, error } = await supabase
    .from('menus')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !menu) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const photos: Array<{ path: string; type: string; uploadedAt: string }> =
    Array.isArray(menu.source_photos) ? menu.source_photos : []

  if (photos.length > 0) {
    const paths = photos.map(p => p.path)
    const signedUrls = await getSignedMenuPhotoUrls(paths)
    menu.source_photos = photos.map(p => ({ ...p, signedUrl: signedUrls[p.path] ?? null }))
  }

  return NextResponse.json(menu)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceClient()
  const body = await req.json()

  const allowed = [
    'title', 'occasion', 'cuisine', 'season', 'guest_min', 'guest_max',
    'courses', 'source_photos', 'status', 'notes', 'last_used_at', 'price_per_guest',
  ]
  const patch: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) patch[key] = body[key]
  }

  const { data, error } = await supabase
    .from('menus')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
