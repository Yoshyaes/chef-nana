'use client'

import { useState } from 'react'

interface WaitlistFormProps {
  eventSlug: string
  onCancel?: () => void
  heading?: string
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function WaitlistForm({ eventSlug, onCancel, heading = 'Join the waitlist' }: WaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateEmail(email)) {
      setStatus('error')
      setErrorMessage('Enter a valid email address.')
      return
    }

    setStatus('submitting')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, eventSlug }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setStatus('error')
        setErrorMessage(data.message || 'Something went wrong. Please try again.')
        return
      }
      setStatus('done')
    } catch {
      setStatus('error')
      setErrorMessage('Something went wrong. Please try again.')
    }
  }

  if (status === 'done') {
    return (
      <>
        <p className="font-cormorant italic text-[20px] text-brown mb-4">
          You&apos;re on the list. We&apos;ll email you when tickets go live.
        </p>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-[11px] tracking-[0.15em] uppercase text-brown-mid hover:text-brown"
          >
            Close
          </button>
        )}
      </>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="font-cormorant italic text-[20px] text-brown mb-4">{heading}</p>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className="form-field mb-3"
        autoFocus
      />
      {status === 'error' && <p className="text-[13px] text-terracotta mb-3">{errorMessage}</p>}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="text-[11px] tracking-[0.15em] uppercase text-brown bg-gold px-4 py-2 hover:bg-gold-light transition-colors disabled:opacity-60 border-0 cursor-pointer"
        >
          {status === 'submitting' ? 'Submitting…' : 'Join Waitlist'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-[11px] tracking-[0.15em] uppercase text-brown-mid hover:text-brown"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
