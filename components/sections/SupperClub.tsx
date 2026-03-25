import FadeIn from '@/components/ui/FadeIn'
import SectionLabel from '@/components/ui/SectionLabel'
import EventCard from '@/components/ui/EventCard'
import Button from '@/components/ui/Button'

const events = [
  {
    date: 'Apr 12',
    location: 'Brooklyn, NY',
    title: 'A West African Spring Table',
    price: '$125pp',
  },
  {
    date: 'May 3',
    location: 'Philadelphia, PA',
    title: 'Jollof & Jazz: A Diaspora Dinner',
    price: '$115pp',
  },
  {
    date: 'Jun 7',
    location: 'Accra, Ghana',
    title: 'Back to Roots: A Homecoming Feast',
    price: '₵850pp',
  },
]

export default function SupperClub() {
  return (
    <section
      id="supper"
      className="grid grid-cols-1 lg:grid-cols-2 min-h-[85vh]"
    >
      {/* Content — left */}
      <div
        className="bg-cream-dark flex flex-col justify-center"
        style={{
          paddingLeft: 'clamp(32px, 5.6vw, 80px)',
          paddingRight: 'clamp(32px, 5.6vw, 80px)',
          paddingTop: 'clamp(64px, 7vw, 100px)',
          paddingBottom: 'clamp(64px, 7vw, 100px)',
        }}
      >
        <FadeIn>
          <SectionLabel color="green">Signature Experience</SectionLabel>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2
            className="font-cormorant font-light text-brown leading-[1.15] mb-6"
            style={{ fontSize: 'clamp(42px, 5vw, 62px)' }}
          >
            Love That
            <br />I <em className="italic text-green">Knead</em>
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="text-[18px] leading-[1.85] text-brown-mid font-light mb-7" style={{ maxWidth: '480px' }}>
            An intimate supper club series celebrating the foodways of West Africa — reimagined
            through a fine-dining lens and served around a communal table. Each dinner is a four
            to five course journey through history, memory, and flavor.
          </p>
          <p className="text-[18px] leading-[1.85] text-brown-mid font-light mb-9" style={{ maxWidth: '480px' }}>
            Pairings. Stories. Culture. No two dinners are the same.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="flex gap-2 mb-9">
            {[
              { label: 'New York', bg: 'bg-green' },
              { label: 'Philadelphia', bg: 'bg-green-light' },
              { label: 'Accra, Ghana', bg: 'bg-brown-mid' },
            ].map(({ label, bg }) => (
              <div
                key={label}
                className={`${bg} text-cream text-[12px] tracking-[0.2em] uppercase px-5 py-2.5`}
              >
                {label}
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="flex flex-wrap gap-4">
            <Button variant="green" href="https://exploretock.com/georginas">
              Get Tickets
            </Button>
            <Button
              variant="outline"
              href="#newsletter"
              className="!text-brown !border-green/50 hover:!border-green"
            >
              Join Waitlist
            </Button>
          </div>
        </FadeIn>
      </div>

      {/* Visual — right */}
      <div className="relative overflow-hidden min-h-[420px] lg:min-h-0" style={{ background: 'var(--green)' }}>
        {/* Gradient bg */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #1A3D28 0%, #0D2419 60%, #2C3A10 100%)',
          }}
        />

        {/* Grid geo overlay */}
        <div className="absolute inset-0 geo-grid" />

        {/* Center emblem */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <div
            className="rounded-full border border-gold/35 flex flex-col items-center justify-center gap-1 relative"
            style={{ width: 'clamp(140px, 25vw, 200px)', height: 'clamp(140px, 25vw, 200px)' }}
          >
            {/* Inner ring */}
            <div className="absolute inset-3 rounded-full border border-gold/20" />
            <div className="font-cormorant text-[13px] tracking-[0.12em] text-gold-light text-center leading-[1.5] relative z-10">
              Love That
              <br />
              I Knead
              <br />
              Supper Club
            </div>
            <div className="text-[9px] tracking-[0.3em] uppercase text-gold/50 relative z-10">
              EST. 2020
            </div>
          </div>
        </div>

        {/* Event cards — bottom */}
        <div
          className="absolute left-0 right-0"
          style={{ bottom: 'clamp(24px, 4vw, 60px)', paddingLeft: 'clamp(16px, 3vw, 40px)', paddingRight: 'clamp(16px, 3vw, 40px)' }}
        >
          {events.map((event) => (
            <EventCard key={event.date} {...event} />
          ))}
        </div>
      </div>
    </section>
  )
}
