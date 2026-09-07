'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { MAX_TICKETS_PER_ORDER } from '@/lib/ticketing'

// Module scope on purpose: starts fetching Stripe.js as soon as this chunk
// evaluates, rather than waiting for the component to mount.
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
  const [soldOut, setSoldOut] = useState(false)
  const [error, setError] = useState(false)

  // Stripe renders its form into an iframe that stays empty for a beat after
  // hydration — Stripe.js downloads, the session round trips, then the iframe
  // paints. With nothing in that space the panel reads as broken, so a
  // skeleton holds the shape until the real form has measurable height.
  const [ready, setReady] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Both observers report asynchronously, so readiness is only ever set
    // from a callback — never synchronously in the effect body. ResizeObserver
    // fires once on observe(), which covers an iframe that is already present
    // and sized (a remount after the browser has everything cached).
    const check = () => {
      const frame = el.querySelector('iframe')
      if (frame && frame.getBoundingClientRect().height > 80) setReady(true)
    }

    const mo = new MutationObserver(check)
    mo.observe(el, { childList: true, subtree: true })
    const ro = new ResizeObserver(check)
    ro.observe(el)

    return () => {
      mo.disconnect()
      ro.disconnect()
    }
  }, [quantity])

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
            onChange={(e) => {
              setReady(false)
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

      {/* Mounted on first paint so the payment fields are there to be filled in
          without the guest first having to touch the seat selector. The cost is
          a Checkout Session per page view; sessions hold no inventory (seats are
          only counted in fulfill_checkout, after payment) and Stripe expires
          unused ones, so abandoned views are harmless. */}
      <div ref={containerRef} className="relative">
        {!ready && (
          <div className="absolute inset-0" aria-hidden="true">
            <CheckoutSkeleton />
          </div>
        )}
        <div className={ready ? undefined : 'opacity-0'}>
          <EmbeddedCheckoutProvider key={quantity} stripe={stripePromise} options={{ fetchClientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  )
}

// Mirrors the real form's shape — email, name, then payment methods — so the
// swap to the live iframe is not a jolt.
function CheckoutSkeleton() {
  return (
    <div className="animate-pulse" role="status" aria-label="Loading payment form">
      <div className="h-2.5 w-14 bg-brown-mid/15 mb-2.5" />
      <div className="h-11 w-full bg-brown-mid/10 mb-6" />
      <div className="h-2.5 w-40 bg-brown-mid/15 mb-2.5" />
      <div className="h-11 w-full bg-brown-mid/10 mb-6" />
      <div className="h-2.5 w-28 bg-brown-mid/15 mb-2.5" />
      <div className="h-14 w-full bg-brown-mid/10 mb-2" />
      <div className="h-14 w-full bg-brown-mid/10 mb-2" />
      <div className="h-14 w-full bg-brown-mid/10" />
    </div>
  )
}
