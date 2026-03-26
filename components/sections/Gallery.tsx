'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import FadeIn from '@/components/ui/FadeIn'
import SectionLabel from '@/components/ui/SectionLabel'

interface GalleryCell {
  caption: string
  image?: { src: string; alt: string; position?: string }
  gradient?: string
}

const cells: GalleryCell[] = [
  {
    caption: 'Chef Nana on Chopped',
    image: { src: '/images/instagram_DBteinZR9xV.jpg', alt: 'Chef Nana on Chopped', position: 'object-top' },
  },
  {
    caption: 'Small Bowls · Love That I Knead',
    image: { src: '/images/nana-lifestyle.jpg', alt: 'Wooden bowls being plated', position: 'object-center' },
  },
  {
    caption: 'The Team at Plating · Catering Event',
    image: { src: '/images/nana-event.jpg', alt: 'Chef Nana and team plating dishes', position: 'object-top' },
  },
  {
    caption: 'Jollof Rice, Reimagined · Philadelphia',
    image: { src: '/images/food-2.jpg', alt: 'West African plate with jollof rice', position: 'object-center' },
  },
  {
    caption: 'Green Kontomire · Accra Residency',
    image: { src: '/images/e79569e6-f79a-4707-91ef-5fa8d0b54648.avif', alt: 'Green Kontomire dish', position: 'object-center' },
  },
]

export default function Gallery() {
  return (
    <section
      id="gallery"
      className="bg-cream"
      style={{
        paddingLeft: 'clamp(24px, 4.2vw, 60px)',
        paddingRight: 'clamp(24px, 4.2vw, 60px)',
        paddingTop: 'clamp(60px, 7vw, 100px)',
        paddingBottom: 'clamp(60px, 7vw, 100px)',
      }}
    >
      {/* Header */}
      <FadeIn>
        <div className="flex justify-between items-end" style={{ marginBottom: '40px' }}>
          <div>
            <SectionLabel color="terracotta">Portfolio</SectionLabel>
            <h2 className="font-cormorant font-light text-brown leading-none" style={{ fontSize: 'clamp(36px, 5vw, 52px)' }}>
              The <em className="italic text-terracotta">work</em>
            </h2>
          </div>
          <a
            href="#"
            className="text-[11px] tracking-[0.2em] uppercase text-terracotta font-medium flex items-center gap-2 no-underline pb-5 hover:opacity-70 transition-opacity"
          >
            View Full Gallery →
          </a>
        </div>
      </FadeIn>

      {/* Mosaic Grid — tall portrait left, 2×2 right */}
      <div className="gallery-grid">
        {cells.map((cell, i) => (
          <motion.div
            key={i}
            className="relative overflow-hidden cursor-pointer"
            style={{ minHeight: '240px' }}
            whileHover="hover"
          >
            {/* Image or gradient background */}
            {cell.image ? (
              <motion.div
                className="absolute inset-0"
                variants={{ hover: { scale: 1.04 } }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <Image
                  src={cell.image.src}
                  alt={cell.image.alt}
                  fill
                  className={`object-cover ${cell.image.position ?? 'object-center'}`}
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              </motion.div>
            ) : (
              <motion.div
                className={`w-full h-full ${cell.gradient}`}
                variants={{ hover: { scale: 1.04 } }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            )}

            {/* Caption overlay */}
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
                {cell.caption}
              </p>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
