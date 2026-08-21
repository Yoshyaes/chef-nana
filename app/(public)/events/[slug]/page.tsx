import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import Checkout from '@/components/Checkout'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100)
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServiceClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!event || event.status === 'draft') notFound()

  const { data: sold } = await supabase.rpc('seats_sold', { p_event: event.id })
  const seatsSold = sold ?? 0
  const seatsLeft = Math.max(event.capacity - seatsSold, 0)
  const canBuy = event.status === 'published' && seatsLeft > 0

  return (
    <section
      className="min-h-[70vh] bg-cream-dark"
      style={{
        paddingLeft: 'clamp(24px, 6vw, 80px)',
        paddingRight: 'clamp(24px, 6vw, 80px)',
        paddingTop: 'clamp(96px, 10vw, 140px)',
        paddingBottom: 'clamp(64px, 8vw, 100px)',
      }}
    >
      <div className="mx-auto" style={{ maxWidth: '640px' }}>
        {event.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-auto object-cover mb-8"
            style={{ maxHeight: '360px' }}
          />
        )}

        <h1
          className="font-cormorant font-light text-brown leading-[1.15] mb-4"
          style={{ fontSize: 'clamp(36px, 5vw, 54px)' }}
        >
          {event.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 mb-6 text-[15px] text-brown-mid">
          <span>{formatDate(event.event_date)}</span>
          {event.location && (
            <>
              <span aria-hidden="true">·</span>
              <span>{event.location}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>{formatPrice(event.price_cents, event.currency)}</span>
        </div>

        {event.description && (
          <p className="text-[18px] leading-[1.85] text-brown-mid font-light mb-8" style={{ maxWidth: '520px' }}>
            {event.description}
          </p>
        )}

        {canBuy ? (
          <Checkout eventId={event.id} priceCents={event.price_cents} currency={event.currency} />
        ) : (
          <div className="inline-block bg-brown-mid text-cream text-[13px] tracking-[0.18em] uppercase px-6 py-3.5">
            Sold out
          </div>
        )}
      </div>
    </section>
  )
}
