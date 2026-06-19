import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createServiceClient()
  const { searchParams } = new URL(req.url)
  const stage = searchParams.get('stage')
  const search = searchParams.get('q')

  let query = supabase
    .from('leads')
    .select('*')
    .order('fit_score', { ascending: false })

  if (stage) query = query.eq('stage', stage)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('leads')
    .insert({
      name: body.name,
      organization: body.organization,
      type: body.type,
      market: body.market,
      email: body.email,
      linkedin_url: body.linkedin_url,
      source: body.source ?? 'manual',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
