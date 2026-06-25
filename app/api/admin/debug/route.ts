import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Test Supabase connection if vars are present
  let dbTest: string = 'skipped'
  if (url && service) {
    try {
      const { createServerClient } = await import('@supabase/ssr')
      const supabase = createServerClient(url, service, { cookies: { getAll: () => [], setAll: () => {} } })
      const { error } = await supabase.from('settings').select('id').single()
      dbTest = error ? `error: ${error.message} (code: ${error.code})` : 'ok'
    } catch (e) {
      dbTest = `threw: ${e instanceof Error ? e.message : String(e)}`
    }
  }

  return NextResponse.json({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: url ? `set (${url.slice(0, 30)}…)` : 'MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: anon ? `set (${anon.slice(0, 20)}…)` : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: service ? `set (${service.slice(0, 20)}…)` : 'MISSING',
    },
    dbTest,
  })
}
