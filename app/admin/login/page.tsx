'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin/today` },
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{
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

        {sent ? (
          <div style={{ background: '#fff', border: '1px solid #e5d9c9', borderRadius: 12, padding: 32 }}>
            <div style={{ fontSize: 20, color: 'var(--brown)', marginBottom: 8, fontFamily: 'var(--font-serif)' }}>
              Check your email
            </div>
            <p style={{ color: '#7a6652', fontSize: 14, lineHeight: 1.6 }}>
              We sent a magic link to <strong>{email}</strong>. Click it to sign in.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #e5d9c9', borderRadius: 12, padding: 32 }}>
            <div style={{ marginBottom: 20, textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: 12, color: '#7a6652', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="nana@chefnanawilmot.com"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box',
                  outline: 'none', color: 'var(--brown)',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px', background: 'var(--gold)',
                color: '#fff', border: 'none', borderRadius: 8, fontSize: 14,
                fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>

      <style>{`
        :root {
          --gold: #C9973A;
          --terracotta: #B85A35;
          --green-dark: #2D5F3D;
          --cream: #F7F1E8;
          --brown: #2C1A0E;
          --font-serif: 'Georgia', serif;
          --font-sans: system-ui, sans-serif;
        }
      `}</style>
    </div>
  )
}
