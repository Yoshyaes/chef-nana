'use client'

import { useState } from 'react'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.message || 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }

      setStatus('success')
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div
      id="newsletter"
      className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8"
      style={{
        background: 'var(--terracotta-deep)',
        paddingLeft: 'clamp(24px, 4.2vw, 60px)',
        paddingRight: 'clamp(24px, 4.2vw, 60px)',
        paddingTop: 'clamp(40px, 3.5vw, 50px)',
        paddingBottom: 'clamp(40px, 3.5vw, 50px)',
      }}
    >
      {/* Text */}
      <div>
        <h3 className="font-cormorant text-[36px] font-normal text-cream italic">
          Join the Table
        </h3>
        <p className="text-[14px] text-cream/60 mt-2 font-light">
          First access to supper club tickets, new menus, and stories from the kitchen.
        </p>
      </div>

      {/* Form */}
      {status === 'success' ? (
        <p className="font-cormorant text-[20px] italic text-gold flex-1" style={{ maxWidth: '440px' }}>
          You&rsquo;re on the list.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-1"
          style={{ maxWidth: '440px' }}
          noValidate
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="flex-1 border border-r-0 border-cream/25 px-5 py-3.5 font-jost text-[14px] text-cream outline-none placeholder:text-cream/40"
            style={{ background: 'rgba(247,241,232,0.1)' }}
            aria-label="Email address"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-gold text-brown border-0 px-7 py-3.5 font-jost text-[11px] font-semibold tracking-[0.18em] uppercase cursor-pointer transition-colors duration-200 hover:bg-gold-light whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? '…' : 'Join'}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p className="w-full text-[12px] text-cream/60 mt-1">{errorMsg}</p>
      )}
    </div>
  )
}
