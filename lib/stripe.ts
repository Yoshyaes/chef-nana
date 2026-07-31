import Stripe from 'stripe'

// Server-only. Never import this from a 'use client' file — it reads
// STRIPE_SECRET_KEY, which must not reach the browser bundle. Lazy-init
// (not a module-scope constant) so importing this file doesn't throw for
// routes that happen to pull it in transitively before the key is set.
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
  return new Stripe(key)
}
