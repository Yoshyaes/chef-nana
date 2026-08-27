import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Vercel kills the whole edge function at 25s with no response, which turns any
// hung Supabase call into a hard 504 for every admin request. Race against a
// shorter timeout instead so a Supabase blip degrades to a login redirect.
const AUTH_CHECK_TIMEOUT_MS = 8000

function withTimeout<T>(promiseLike: PromiseLike<T>, ms: number): Promise<T> {
  const promise = Promise.resolve(promiseLike)
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      const timer = setTimeout(() => reject(new Error('Auth check timed out')), ms)
      promise.finally(() => clearTimeout(timer))
    }),
  ])
}

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

  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
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

  let user = null
  try {
    const result = await withTimeout(supabase.auth.getUser(), AUTH_CHECK_TIMEOUT_MS)
    user = result.data.user
  } catch {
    // Timed out or errored talking to Supabase — treat as unauthenticated rather
    // than hanging until Vercel force-kills the function at 25s.
  }

  if (!user) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // A session alone is no longer enough, a matching profiles row is required
  // too. Checked with the service role rather than the user-scoped client
  // above, so this does not depend on the profiles RLS policy, matching how
  // every other read in this app defaults to the service role. Fails closed:
  // if the service role key is missing, that is a misconfiguration, not a
  // reason to let an unauthorized session through, so it is treated the same
  // as "no matching profile."
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  let hasProfile = false

  if (serviceRoleKey) {
    const serviceClient = createServerClient(supabaseUrl, serviceRoleKey, {
      cookies: { getAll: () => [], setAll: () => {} },
    })

    try {
      const { data: profile } = await withTimeout(
        serviceClient.from('profiles').select('id').eq('id', user.id).maybeSingle(),
        AUTH_CHECK_TIMEOUT_MS
      )
      hasProfile = !!profile
    } catch {
      // Timed out or errored — falls through to fail-closed below, same as a
      // missing profile row.
    }
  }

  if (!hasProfile) {
    try {
      await withTimeout(supabase.auth.signOut(), AUTH_CHECK_TIMEOUT_MS)
    } catch {
      // Best-effort — the redirect below still ends the request either way.
    }

    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('error', 'unauthorized')
    const redirectResponse = NextResponse.redirect(loginUrl)
    response.cookies.getAll().forEach(cookie => redirectResponse.cookies.set(cookie))
    return redirectResponse
  }

  return response
}

export const config = {
  matcher: ['/', '/admin/:path*', '/auth/:path*', '/api/admin/:path*'],
}
