import { NextResponse, type NextRequest } from 'next/server'
import { getSanityClient } from '@/lib/sanity/server'

const ALLOWED_TYPES = ['event', 'service', 'credential', 'pressItem', 'siteSettings']

export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  if (!ALLOWED_TYPES.includes(type)) return NextResponse.json({ error: 'Unknown type' }, { status: 400 })

  const client = getSanityClient()
  const docs = await client.fetch(`*[_type == $type] | order(order asc, _createdAt asc)`, { type })
  return NextResponse.json(docs)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  if (!ALLOWED_TYPES.includes(type)) return NextResponse.json({ error: 'Unknown type' }, { status: 400 })

  const body = await req.json()
  const client = getSanityClient()
  const doc = await client.create({ _type: type, ...body })
  return NextResponse.json(doc)
}
