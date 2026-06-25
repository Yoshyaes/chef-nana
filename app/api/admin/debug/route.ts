import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY

  let idTest: string = 'skipped'
  let fullTest: string = 'skipped'
  let cookiesTest: string = 'skipped'

  if (url && service) {
    const { createServerClient } = await import('@supabase/ssr')
    const supabase = createServerClient(url, service, { cookies: { getAll: () => [], setAll: () => {} } })

    // Test 1: basic id query (same as before)
    try {
      const { error } = await supabase.from('settings').select('id').single()
      idTest = error ? `error: ${error.message} (code: ${error.code})` : 'ok'
    } catch (e) { idTest = `threw: ${e instanceof Error ? e.message : String(e)}` }

    // Test 2: exact columns the settings route queries
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('monthly_budget_cap, current_month_spend, brand_voice_notes, approve_before_sending, sending_domain')
        .single()
      fullTest = error ? `error: ${error.message} (code: ${error.code})` : `ok — row: ${JSON.stringify(data)}`
    } catch (e) { fullTest = `threw: ${e instanceof Error ? e.message : String(e)}` }

    // Test 3: test with cookies() like the real route does
    try {
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      const supabaseWithCookies = createServerClient(url, service, {
        cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} }
      })
      const { data, error } = await supabaseWithCookies.from('settings')
        .select('monthly_budget_cap, current_month_spend')
        .single()
      cookiesTest = error ? `error: ${error.message} (code: ${error.code})` : `ok — cap: ${data?.monthly_budget_cap}`
    } catch (e) { cookiesTest = `threw: ${e instanceof Error ? e.message : String(e)}` }
  }

  return NextResponse.json({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: url ? `set (${url.slice(0, 30)}…)` : 'MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: anon ? `set (${anon.slice(0, 20)}…)` : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: service ? `set (${service.slice(0, 20)}…)` : 'MISSING',
    },
    idTest,
    fullTest,
    cookiesTest,
  })
}
