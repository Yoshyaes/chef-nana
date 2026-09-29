'use client'

import { useState } from 'react'

interface WaitlistButtonProps {
  eventSlug: string
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function WaitlistButton({ eventSlug }: WaitlistButtonProps) {
  const [open, setOpen] = useState(false)
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-block text-[11px] tracking-[0.15em] uppercase text-brown bg-gold px-4 py-2 hover:bg-gold-light transition-colors whitespace-nowrap cursor-pointer border-0"
      >
        Join Waitlist
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Join the waitlist"
          className="fixed inset-0 flex items-center justify-center p-6"
          style={{ background: 'rgba(18,8,2,0.85)', zIndex: 200 }}
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-cream w-full"
            style={{ maxWidth: '420px', padding: '32px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {status === 'done' ? (
              <>
                <p className="font-cormorant italic text-[20px] text-brown mb-4">
                  You&apos;re on the list. We&apos;ll email you when tickets go live.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-[11px] tracking-[0.15em] uppercase text-brown-mid hover:text-brown"
                >
                  Close
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <p className="font-cormorant italic text-[20px] text-brown mb-4">
                  Join the waitlist
                </p>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="form-field mb-3"
                  autoFocus
                />
                {status === 'error' && (
                  <p className="text-[13px] text-terracotta mb-3">{errorMessage}</p>
                )}
                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="text-[11px] tracking-[0.15em] uppercase text-brown bg-gold px-4 py-2 hover:bg-gold-light transition-colors disabled:opacity-60 border-0 cursor-pointer"
                  >
                    {status === 'submitting' ? 'Submitting…' : 'Join Waitlist'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-[11px] tracking-[0.15em] uppercase text-brown-mid hover:text-brown"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
