import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Supabase sometimes sends the OAuth code to the site root instead of /auth/callback
  // when the redirect URL allowlist hasn't propagated. Catch it here and forward it.
  if (pathname === '/' && searchParams.has('code')) {
    const callbackUrl = new URL('/auth/callback', request.url)
    callbackUrl.searchParams.set('code', searchParams.get('code')!)
    callbackUrl.searchParams.set('next', '/admin/today')
    return NextResponse.redirect(callbackUrl)
  }

  // Pass through: login, OAuth callbacks, Inngest webhook, Discord interactions, Gmail OAuth
  if (
    pathname === '/admin/login' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/admin/inngest') ||
    pathname.startsWith('/api/admin/gmail/') ||
    pathname.startsWith('/api/discord/')
  ) {
    return NextResponse.next()
  }

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase isn't configured yet, allow through (dev mode)
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookies) {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/', '/admin/:path*', '/auth/:path*', '/api/admin/gmail/:path*'],
}
