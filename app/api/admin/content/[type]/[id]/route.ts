import { NextResponse, type NextRequest } from 'next/server'
import { getSanityClient } from '@/lib/sanity/server'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ type: string; id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const client = getSanityClient()
  const doc = await client.patch(id).set(body).commit()
  return NextResponse.json(doc)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ type: string; id: string }> }) {
  const { id } = await params
  const client = getSanityClient()
  await client.delete(id)
  return NextResponse.json({ deleted: true })
}
