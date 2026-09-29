import { notFound } from 'next/navigation'
import { getEventByWaitlistSlug } from '@/lib/queries'
import WaitlistForm from '@/components/ui/WaitlistForm'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await getEventByWaitlistSlug(slug).catch(() => null)
  return { title: event ? `Join the Waitlist — ${event.title} | Chef Nana Araba` : 'Join the Waitlist | Chef Nana Araba' }
}

export default async function WaitlistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await getEventByWaitlistSlug(slug).catch(() => null)

  if (!event) notFound()

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
      <div className="mx-auto lg:grid lg:grid-cols-[1fr_400px] lg:gap-x-16 lg:items-start" style={{ maxWidth: '1000px' }}>
        <div style={{ maxWidth: '560px' }}>
          <div className="text-[11px] tracking-[0.2em] uppercase text-terracotta font-medium mb-4">
            Love That I Knead
          </div>

          <h1
            className="font-cormorant font-light text-brown leading-[1.15] mb-4"
            style={{ fontSize: 'clamp(36px, 5vw, 54px)' }}
          >
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mb-6 text-[15px] text-brown-mid">
            <span>{event.date}</span>
            {event.location && (
              <>
                <span aria-hidden="true">·</span>
                <span>{event.location}</span>
              </>
            )}
          </div>

          <p className="text-[18px] leading-[1.85] text-brown-mid font-light" style={{ maxWidth: '480px' }}>
            {event.detail || "Join the waitlist and we'll email you the moment tickets go live."}
          </p>
        </div>

        <div className="mt-10 lg:mt-0 bg-cream" style={{ padding: '32px' }}>
          <WaitlistForm eventSlug={slug} />
        </div>
      </div>
    </section>
  )
}
