'use client'

import { useCallback, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { MAX_TICKETS_PER_ORDER } from '@/lib/ticketing'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100)
}

interface CheckoutProps {
  eventId: string
  priceCents: number
  currency: string
}

export default function Checkout({ eventId, priceCents, currency }: CheckoutProps) {
  const [quantity, setQuantity] = useState(1)
  // Undefined until the guest actually engages with the form — mounting
  // EmbeddedCheckoutProvider is what creates a Stripe session, and creating
  // one on every page view (including bounces) piles up abandoned sessions.
  const [engaged, setEngaged] = useState(false)
  const [soldOut, setSoldOut] = useState(false)
  const [error, setError] = useState(false)

  // Re-created whenever quantity changes; combined with key={quantity} on
  // the provider below, changing the selector remounts the provider and
  // re-invokes this with the new quantity, requesting a freshly sized
  // session rather than relying on Stripe's adjustable_quantity.
  const fetchClientSecret = useCallback(async () => {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, quantity }),
    })

    if (res.status === 409) {
      setSoldOut(true)
      throw new Error('sold_out')
    }
    if (!res.ok) {
      setError(true)
      throw new Error('checkout_failed')
    }

    const { clientSecret } = await res.json()
    return clientSecret as string
  }, [eventId, quantity])

  if (soldOut) {
    return (
      <div className="inline-block bg-brown-mid text-cream text-[13px] tracking-[0.18em] uppercase px-6 py-3.5">
        Sold out
      </div>
    )
  }

  if (error) {
    return <p className="text-[14px] text-brown-mid">Something went wrong. Please refresh and try again.</p>
  }

  return (
    <div style={{ maxWidth: '480px' }}>
      <div className="flex items-end gap-4 mb-5">
        <div>
          <label htmlFor="ticket-quantity" className="block text-[11px] tracking-[0.18em] uppercase text-brown-mid mb-2">
            Seats
          </label>
          <select
            id="ticket-quantity"
            value={quantity}
            onFocus={() => setEngaged(true)}
            onChange={(e) => {
              setEngaged(true)
              setQuantity(Number(e.target.value))
            }}
            className="border border-brown-mid/30 bg-cream text-[15px] text-brown px-4 py-2.5 outline-none"
          >
            {Array.from({ length: MAX_TICKETS_PER_ORDER }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <p className="text-[15px] text-brown-mid pb-2.5">
          Total <span className="text-brown">{formatPrice(priceCents * quantity, currency)}</span>
        </p>
      </div>

      <div id="checkout" onMouseEnter={() => setEngaged(true)} onTouchStart={() => setEngaged(true)}>
        {engaged && (
          <EmbeddedCheckoutProvider key={quantity} stripe={stripePromise} options={{ fetchClientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        )}
      </div>
    </div>
  )
}
