'use client'

import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  async function handleGoogleSignIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/admin/today`,
      },
    })
  }

  return (
    <div className="admin-scope" style={{
      minHeight: '100vh',
      background: 'var(--cream)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{ width: 360, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--brown)', marginBottom: 8 }}>
          Georgina&apos;s Assistant
        </div>
        <div style={{ fontSize: 13, color: '#7a6652', marginBottom: 40 }}>Lead Studio</div>

        <div style={{ background: '#fff', border: '1px solid #e5d9c9', borderRadius: 12, padding: 32 }}>
          {error && (
            <div style={{
              background: '#fef2f0', border: '1px solid #f5c6bb', borderRadius: 8,
              padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#B85A35',
            }}>
              {error === 'unauthorized'
                ? 'Your Google account is not authorized to access this admin.'
                : 'Sign-in failed. Please try again.'}
            </div>
          )}

          <p style={{ color: '#7a6652', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Sign in with your Google account to access the admin.
          </p>

          <button
            onClick={handleGoogleSignIn}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '12px 16px',
              background: '#fff',
              color: '#3c3c3c',
              border: '1px solid #ddd',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              transition: 'box-shadow 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.14)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)')}
          >
            <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M47.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h13.2c-.6 3-2.4 5.6-5 7.3v6h8.1c4.7-4.4 7.2-10.8 7.2-17.3z"/>
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.8-5.7l-8.1-6c-2.1 1.4-4.7 2.2-7.7 2.2-5.9 0-10.9-4-12.7-9.3H3v6.2C6.9 42.8 14.9 48 24 48z"/>
              <path fill="#FBBC05" d="M11.3 29.2c-.5-1.4-.7-2.8-.7-4.2s.2-2.8.7-4.2V14.6H3C1.1 18.2 0 22 0 24s1.1 5.8 3 9.4l8.3-4.2z"/>
              <path fill="#EA4335" d="M24 9.5c3.3 0 6.3 1.1 8.6 3.4l6.4-6.4C34.9 2.6 29.8 0 24 0 14.9 0 6.9 5.2 3 13.6l8.3 5c1.8-5.3 6.8-9.1 12.7-9.1z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
