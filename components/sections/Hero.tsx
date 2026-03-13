'use client'

import { motion } from 'framer-motion'
import type { Easing } from 'framer-motion'
import Image from 'next/image'
import Button from '@/components/ui/Button'

const EASE: Easing = 'easeOut'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1.2, ease: EASE, delay },
})

export default function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-end overflow-hidden"
      style={{ minHeight: '700px' }}
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 60% 40%, rgba(180,90,30,0.35) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(45,95,61,0.4) 0%, transparent 55%), linear-gradient(160deg, #1A0C06 0%, #2C1A0E 40%, #3B2010 100%)',
        }}
      />

      {/* Kente accent stripe — right edge */}
      <div className="absolute right-0 top-0 bottom-0 gradient-kente-vertical" style={{ width: '5px' }} />

      {/* Hero overlay — text legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(18,8,2,0.9) 0%, rgba(18,8,2,0.7) 45%, rgba(18,8,2,0.1) 75%, transparent 100%)',
        }}
      />

      {/* Image Panel — desktop only */}
      <div
        className="absolute hidden md:block border border-gold/30 overflow-hidden"
        style={{
          right: '80px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '420px',
          height: '540px',
          borderRadius: '2px',
        }}
      >
        <Image
          src="/images/nana-topchef.png"
          alt="Chef Nana Araba Wilmot — Top Chef Season 23"
          fill
          className="object-cover object-center"
          priority
          sizes="420px"
        />
        {/* Subtle dark overlay so it reads against the hero bg */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(18,8,2,0.1) 0%, rgba(18,8,2,0.25) 100%)' }}
        />
      </div>

      {/* Top Chef Badge */}
      <motion.div
        {...fadeUp(1.0)}
        className="absolute z-20 hidden md:block"
        style={{ top: '100px', left: 'clamp(24px, 4.2vw, 60px)' }}
      >
        <div
          className="flex flex-col items-center text-center border border-gold/50"
          style={{
            background: 'rgba(18,8,2,0.75)',
            backdropFilter: 'blur(10px)',
            padding: '16px 24px',
            width: '150px',
          }}
        >
          {/* Top label */}
          <div className="text-[8px] tracking-[0.35em] uppercase text-gold/60 font-jost font-medium">
            As Seen On
          </div>

          {/* Divider */}
          <div className="w-full h-px mt-2 mb-2.5" style={{ background: 'rgba(201,151,58,0.25)' }} />

          {/* Show name */}
          <div className="font-cormorant text-[22px] italic font-light text-gold leading-none">
            Top Chef
          </div>

          {/* Season */}
          <div className="text-[9px] tracking-[0.3em] uppercase text-gold-light font-jost mt-1.5">
            Season 23
          </div>

          {/* Divider */}
          <div className="w-full h-px mt-2.5 mb-2" style={{ background: 'rgba(201,151,58,0.25)' }} />

          {/* Network */}
          <div className="text-[8px] tracking-[0.3em] uppercase text-gold/50 font-jost">
            Now Airing · Bravo
          </div>
        </div>
      </motion.div>

      {/* Hero Content */}
      <div
        className="relative z-10 w-full flex flex-col items-center text-center lg:items-start lg:text-left"
        style={{
          maxWidth: '620px',
          paddingLeft: 'clamp(24px, 4.2vw, 60px)',
          paddingRight: 'clamp(24px, 4.2vw, 60px)',
          paddingBottom: 'clamp(64px, 6vw, 80px)',
        }}
      >
        {/* Flag row */}
        <motion.div {...fadeUp(0)} className="flex items-center gap-2.5 mb-6">
          <div className="w-2 h-2 rounded-full bg-gold" />
          <div className="text-[11px] tracking-[0.25em] uppercase text-gold-light font-medium">
            Ghanaian-American &middot; Michelin-Trained Chef
          </div>
        </motion.div>

        {/* Name */}
        <motion.h1
          {...fadeUp(0.3)}
          className="font-cormorant font-light leading-none text-cream mb-2.5"
          style={{ fontSize: 'clamp(52px, 7vw, 90px)' }}
        >
          Nana
          <em className="block not-italic italic text-gold-light">Araba</em>
          Wilmot
        </motion.h1>

        {/* Divider */}
        <motion.div {...fadeUp(0.5)} className="h-px bg-gold my-7" style={{ width: '60px' }} />

        {/* Tagline */}
        <motion.p
          {...fadeUp(0.6)}
          className="text-[15px] leading-[1.7] text-cream/75 font-light mb-10"
          style={{ maxWidth: '420px' }}
        >
          Michelin-trained private chef reimagining West African heritage cuisine for the modern
          table. Private dining, catering, and supper clubs across three continents.
        </motion.p>

        {/* City tags */}
        <motion.div {...fadeUp(0.7)} className="flex flex-wrap gap-5 mb-10">
          {['New York', 'Philadelphia', 'Accra'].map((city) => (
            <div
              key={city}
              className="text-[10px] tracking-[0.2em] uppercase text-gold/70 border border-gold/25 px-3.5 py-1.5"
            >
              {city}
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div {...fadeUp(0.85)} className="flex flex-col sm:flex-row gap-4">
          <Button variant="primary" href="#booking">
            Book Chef Nana
          </Button>
          <Button variant="outline" href="#supper">
            Upcoming Events
          </Button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        {...fadeUp(1.1)}
        className="absolute bottom-9 flex flex-col items-center gap-2"
        style={{ right: '60px' }}
      >
        <div
          className="w-px animate-scroll-pulse"
          style={{ height: '50px', background: 'linear-gradient(to bottom, transparent, var(--gold))' }}
        />
        <span
          className="text-[9px] tracking-[0.25em] uppercase text-gold/60"
          style={{ writingMode: 'vertical-rl' }}
        >
          Scroll
        </span>
      </motion.div>
    </section>
  )
}
