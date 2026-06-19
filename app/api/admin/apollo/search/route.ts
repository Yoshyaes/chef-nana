import { NextRequest, NextResponse } from 'next/server'
import { searchApollo } from '@/lib/apollo'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { query, titles, locations, limit } = await req.json()

  try {
    const contacts = await searchApollo({ query, titles, locations, limit })

    // Bulk-insert as leads (sourced stage)
    if (contacts.length > 0) {
      const supabase = await createServiceClient()
      const leads = contacts.map(c => ({
        name: c.name,
        organization: c.organization,
        email: c.email,
        linkedin_url: c.linkedin_url,
        source: 'apollo',
        stage: 'sourced',
        market: locations?.[0] ?? null,
      }))
      await supabase.from('leads').upsert(leads, { onConflict: 'email', ignoreDuplicates: true })
    }

    return NextResponse.json({ count: contacts.length, contacts })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
