import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createServiceClient()
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  const occasion = searchParams.get('occasion')
  const cuisine = searchParams.get('cuisine')
  const status = searchParams.get('status')
  const guests = searchParams.get('guests')

  let query = supabase
    .from('menus')
    .select('*')
    .order('updated_at', { ascending: false })

  if (q) {
    query = query.textSearch('search_tsv', q, { type: 'plain', config: 'english' })
  }

  if (occasion) {
    query = query.overlaps('occasion', [occasion])
  }

  if (cuisine) {
    query = query.overlaps('cuisine', [cuisine])
  }

  if (status === 'archived') {
    query = query.eq('status', 'archived')
  } else if (status) {
    query = query.eq('status', status)
  } else {
    query = query.in('status', ['draft', 'active'])
  }

  if (guests) {
    const g = parseInt(guests, 10)
    if (!isNaN(g)) {
      query = query
        .or(`guest_min.is.null,guest_min.lte.${g}`)
        .or(`guest_max.is.null,guest_max.gte.${g}`)
    }
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('menus')
    .insert({
      title: body.title,
      occasion: body.occasion ?? [],
      cuisine: body.cuisine ?? [],
      season: body.season ?? null,
      guest_min: body.guest_min ?? null,
      guest_max: body.guest_max ?? null,
      courses: body.courses ?? [],
      source_photos: body.source_photos ?? [],
      status: body.status ?? 'draft',
      notes: body.notes ?? null,
      last_used_at: body.last_used_at ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
