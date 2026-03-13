'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

interface ServiceCardProps {
  number: string
  title: string
  description: string
  linkText: string
  href: string
}

export default function ServiceCard({
  number,
  title,
  description,
  linkText,
  href,
}: ServiceCardProps) {
  return (
    <motion.div
      whileHover={{ backgroundColor: 'rgba(201, 151, 58, 0.07)' }}
      transition={{ duration: 0.3 }}
      className="relative cursor-pointer border border-gold/[0.08] h-full flex flex-col"
      style={{
        background: 'rgba(255,255,255,0.03)',
        paddingTop: '48px',
        paddingBottom: '48px',
        paddingLeft: '44px',
        paddingRight: '44px',
      }}
    >
      <div className="font-cormorant text-[72px] font-light text-gold/10 leading-none mb-5">
        {number}
      </div>
      <div className="font-cormorant text-[26px] font-medium text-gold-pale mb-3.5 leading-snug">
        {title}
      </div>
      <p className="text-[14px] leading-[1.75] text-cream/50 font-light mb-6 flex-1">{description}</p>
      <Link
        href={href}
        className="text-[11px] tracking-[0.2em] uppercase text-gold font-medium flex items-center gap-2 no-underline transition-[gap] duration-200 hover:gap-3.5"
      >
        {linkText}
      </Link>
    </motion.div>
  )
}
