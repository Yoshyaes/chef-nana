import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data: original, error: fetchError } = await supabase
    .from('menus')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !original) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { id: _id, created_at: _ca, updated_at: _ua, search_tsv: _tsv, ...rest } = original

  const { data, error } = await supabase
    .from('menus')
    .insert({
      ...rest,
      title: `${original.title} (copy)`,
      status: 'draft',
      last_used_at: null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
