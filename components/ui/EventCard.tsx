'use client'

import { useState } from 'react'
import Link from 'next/link'
import WaitlistButton from './WaitlistButton'

interface EventCardProps {
  date: string
  location?: string
  title: string
  price?: string
  ticketUrl?: string
  detail?: string
  ctaType?: 'tickets' | 'donate' | 'waitlist'
  donateUrl?: string
  waitlistEventSlug?: string
}

const ctaClasses =
  'inline-block text-[11px] tracking-[0.15em] uppercase text-brown bg-gold px-4 py-2 hover:bg-gold-light transition-colors whitespace-nowrap'

function TicketLink({ ticketUrl }: { ticketUrl: string }) {
  const isExternal = /^https?:\/\//.test(ticketUrl)

  if (isExternal) {
    return (
      <a href={ticketUrl} target="_blank" rel="noopener noreferrer" className={ctaClasses}>
        Get Tickets
      </a>
    )
  }

  return (
    <Link href={ticketUrl} className={ctaClasses}>
      Get Tickets
    </Link>
  )
}

function EventCta({ ctaType, ticketUrl, donateUrl, waitlistEventSlug }: Pick<EventCardProps, 'ctaType' | 'ticketUrl' | 'donateUrl' | 'waitlistEventSlug'>) {
  if (ctaType === 'donate') {
    return donateUrl ? (
      <a href={donateUrl} target="_blank" rel="noopener noreferrer" className={ctaClasses}>
        Donate
      </a>
    ) : null
  }

  if (ctaType === 'waitlist') {
    return waitlistEventSlug ? <WaitlistButton eventSlug={waitlistEventSlug} /> : null
  }

  return ticketUrl ? <TicketLink ticketUrl={ticketUrl} /> : null
}

export default function EventCard({ date, location, title, price, ticketUrl, detail, ctaType, donateUrl, waitlistEventSlug }: EventCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="border border-gold/20 mb-2.5 backdrop-blur-sm"
      style={{ background: 'rgba(14,36,22,0.8)' }}
    >
      <div
        className="flex justify-between items-center gap-3"
        style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '18px', paddingBottom: '18px' }}
      >
        <div>
          <div className="text-[12px] tracking-[0.15em] text-gold uppercase mb-1">
            {date}{location ? ` · ${location}` : ''}
          </div>
          <div className="font-cormorant text-[18px] text-cream italic">{title}</div>
          {detail && (
            <button
              type="button"
              onClick={() => setExpanded(e => !e)}
              className="text-[11px] text-gold/70 hover:text-gold mt-1.5 underline underline-offset-2"
            >
              {expanded ? 'Hide details' : 'More details'}
            </button>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
          {price && <div className="text-[15px] font-semibold text-gold-light">{price}</div>}
          <EventCta ctaType={ctaType} ticketUrl={ticketUrl} donateUrl={donateUrl} waitlistEventSlug={waitlistEventSlug} />
        </div>
      </div>

      {detail && expanded && (
        <div
          className="border-t border-gold/10"
          style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '14px', paddingBottom: '18px' }}
        >
          <p className="text-[13px] text-cream/70 leading-relaxed">{detail}</p>
        </div>
      )}
    </div>
  )
}
