'use client'

import { useState } from 'react'
import WaitlistForm from './WaitlistForm'

interface WaitlistButtonProps {
  eventSlug: string
}

export default function WaitlistButton({ eventSlug }: WaitlistButtonProps) {
  const [open, setOpen] = useState(false)

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
            <WaitlistForm eventSlug={eventSlug} onCancel={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
