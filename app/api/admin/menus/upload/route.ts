import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient()

  const formData = await req.formData()
  const file = formData.get('file')

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'File type not supported' }, { status: 400 })
  }

  const cleanPath = `${randomUUID()}/${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const { error } = await supabase.storage
    .from('menu-photos')
    .upload(cleanPath, buffer, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    path: cleanPath,
    type: file.type,
    uploadedAt: new Date().toISOString(),
  }, { status: 201 })
}
