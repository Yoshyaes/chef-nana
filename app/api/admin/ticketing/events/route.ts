import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServiceClient()

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: attendees } = await supabase
    .from('attendees')
    .select('event_id, quantity')
    .eq('refunded', false)

  const soldByEvent = new Map<string, number>()
  for (const a of attendees ?? []) {
    soldByEvent.set(a.event_id, (soldByEvent.get(a.event_id) ?? 0) + a.quantity)
  }

  const withSeats = (events ?? []).map(e => ({ ...e, seats_sold: soldByEvent.get(e.id) ?? 0 }))

  return NextResponse.json(withSeats)
}

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('events')
    .insert({
      slug: body.slug,
      title: body.title,
      description: body.description ?? null,
      event_date: body.event_date,
      location: body.location ?? null,
      price_cents: body.price_cents,
      currency: body.currency ?? 'usd',
      capacity: body.capacity,
      image_url: body.image_url ?? null,
      status: body.status ?? 'draft',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
