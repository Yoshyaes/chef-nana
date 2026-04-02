'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import FadeIn from '@/components/ui/FadeIn'
import SectionLabel from '@/components/ui/SectionLabel'
import EventCard from '@/components/ui/EventCard'
import Button from '@/components/ui/Button'

const defaultEvents = [
  {
    date: 'Apr 11 + 12',
    location: 'Washington D.C.',
    title: 'Homecoming: The Taste of Return',
    price: '$180',
  },
  {
    date: 'Apr 23 - 25',
    location: 'Washington D.C.',
    title: 'Black Women In Food Summit Panelist',
  },
  {
    date: 'Apr 26',
    location: 'Philadelphia, PA',
    title: 'Meals On Wheels Celebrity Brunch',
  },
]

const images = [
  {
    src: '/images/Knead/23-11-20-chefnana-39.jpg',
    alt: 'Guests enjoying a communal candlelit dinner',
    caption: 'The Communal Table · Supper Club',
    position: 'object-center',
  },
  {
    src: '/images/Knead/IMG_7018.jpeg',
    alt: 'Elegant table setting with wine glasses and string lights',
    caption: 'The Table Awaits · Setting the Scene',
    position: 'object-center',
  },
  {
    src: '/images/Knead/sc_228__d4a7594.jpeg',
    alt: 'Lively dinner with guests sharing food and wine',
    caption: 'A Night to Remember · Gathering',
    position: 'object-top',
  },
]

const defaultDescription = `An intimate supper club series celebrating the foodways of West Africa and beyond reimagined through a fine-dining lens and served around a communal table. Each dinner is a four to five course journey through history, memory, and flavor.`

interface SupperClubProps {
  events?: { date: string; location?: string; title: string; price?: string }[] | null
  siteSettings?: { supperClubDescription?: string } | null
}

export default function SupperClub({ events: cmsEvents, siteSettings }: SupperClubProps) {
  const events = cmsEvents?.length ? cmsEvents : defaultEvents
  const description = siteSettings?.supperClubDescription || defaultDescription
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
            {description}
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

      {/* Visual — right: Photo mosaic + event cards */}
      <div className="flex flex-col">
        <div className="supper-grid">
          {images.map((img, i) => (
            <FadeIn key={img.src} delay={i * 0.15} className="h-full">
              <motion.div
                className="relative overflow-hidden cursor-pointer h-full"
                whileHover="hover"
              >
                <motion.div
                  className="absolute inset-0"
                  variants={{ hover: { scale: 1.04 } }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className={`object-cover ${img.position}`}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </motion.div>

                {/* Caption overlay on hover */}
                <motion.div
                  className="absolute inset-0 flex items-end"
                  style={{
                    background: 'linear-gradient(to top, rgba(18,8,2,0.75) 0%, transparent 55%)',
                    padding: '20px',
                  }}
                  initial={{ opacity: 0 }}
                  variants={{ hover: { opacity: 1 } }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="font-cormorant text-[15px] italic text-gold-pale tracking-[0.05em]">
                    {img.caption}
                  </p>
                </motion.div>
              </motion.div>
            </FadeIn>
          ))}
        </div>

        {/* Event cards — below mosaic */}
        <div
          style={{
            background: 'rgba(13, 36, 25, 0.95)',
            paddingLeft: 'clamp(16px, 3vw, 40px)',
            paddingRight: 'clamp(16px, 3vw, 40px)',
            paddingTop: 'clamp(16px, 2vw, 24px)',
            paddingBottom: 'clamp(16px, 2vw, 24px)',
          }}
        >
          {events.map((event) => (
            <EventCard key={event.date} {...event} />
          ))}
        </div>
      </div>
    </section>
  )
}
