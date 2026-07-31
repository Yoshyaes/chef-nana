'use client'

import { useCallback, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import Button from '@/components/ui/Button'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutProps {
  eventId: string
}

export default function Checkout({ eventId }: CheckoutProps) {
  const [started, setStarted] = useState(false)
  const [soldOut, setSoldOut] = useState(false)
  const [error, setError] = useState(false)

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
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
  }, [eventId])

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

  if (!started) {
    return (
      <Button variant="green" onClick={() => setStarted(true)}>
        Get tickets
      </Button>
    )
  }

  return (
    <div id="checkout" style={{ maxWidth: '480px' }}>
      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
