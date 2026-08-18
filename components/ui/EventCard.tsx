'use client'

import { useState } from 'react'
import Link from 'next/link'

interface EventCardProps {
  date: string
  location?: string
  title: string
  price?: string
  ticketUrl?: string
  detail?: string
}

function TicketLink({ ticketUrl }: { ticketUrl: string }) {
  const isExternal = /^https?:\/\//.test(ticketUrl)
  const classes =
    'inline-block text-[11px] tracking-[0.15em] uppercase text-brown bg-gold px-4 py-2 hover:bg-gold-light transition-colors whitespace-nowrap'

  if (isExternal) {
    return (
      <a href={ticketUrl} target="_blank" rel="noopener noreferrer" className={classes}>
        Get Tickets
      </a>
    )
  }

  return (
    <Link href={ticketUrl} className={classes}>
      Get Tickets
    </Link>
  )
}

export default function EventCard({ date, location, title, price, ticketUrl, detail }: EventCardProps) {
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
          {ticketUrl && <TicketLink ticketUrl={ticketUrl} />}
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
