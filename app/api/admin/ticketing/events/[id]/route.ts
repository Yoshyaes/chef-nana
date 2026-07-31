import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data: event, error } = await supabase.from('events').select('*').eq('id', id).single()
  if (error || !event) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const { data: attendees } = await supabase
    .from('attendees')
    .select('id, name, email, quantity, checked_in, checked_in_at, refunded, created_at')
    .eq('event_id', id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ event, attendees: attendees ?? [] })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('events')
    .update({
      slug: body.slug,
      title: body.title,
      description: body.description ?? null,
      event_date: body.event_date,
      location: body.location ?? null,
      price_cents: body.price_cents,
      currency: body.currency ?? 'usd',
      capacity: body.capacity,
      image_url: body.image_url ?? null,
      status: body.status,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
