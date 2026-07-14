import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  const service = await createServiceClient()
  const { data: profile, error } = await service
    .from('profiles')
    .select('id, full_name, role, avatar_color')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !profile) {
    return NextResponse.json({ error: 'No profile' }, { status: 404 })
  }

  return NextResponse.json(profile)
}
