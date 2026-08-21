'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'

interface GalleryImage {
  image: unknown
  alt: string
  caption: string
  position: string
  eventName?: string
  eventDate?: string
}

interface Group {
  name: string
  date?: string
  images: GalleryImage[]
}

function groupByEvent(images: GalleryImage[]): Group[] {
  const groups: Group[] = []
  const byName = new Map<string, Group>()

  for (const img of images) {
    const name = img.eventName?.trim() || 'More from the kitchen'
    let group = byName.get(name)
    if (!group) {
      group = { name, date: img.eventDate, images: [] }
      byName.set(name, group)
      groups.push(group)
    }
    group.images.push(img)
  }

  return groups
}

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const groups = groupByEvent(images)

  const flat = groups.flatMap((g) => g.images)
  const open = openIndex !== null ? flat[openIndex] : null

  useEffect(() => {
    if (openIndex === null) return
    closeButtonRef.current?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenIndex(null)
        return
      }
      if (e.key === 'ArrowRight') setOpenIndex((i) => (i === null ? i : Math.min(i + 1, flat.length - 1)))
      if (e.key === 'ArrowLeft') setOpenIndex((i) => (i === null ? i : Math.max(i - 1, 0)))
      if (e.key === 'Tab') {
        // Single focusable element in the lightbox — keep focus trapped on it.
        e.preventDefault()
        closeButtonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [openIndex, flat.length])

  let runningIndex = 0

  return (
    <>
      {groups.map((group) => (
        <div key={group.name} className="mb-16">
          <div className="flex items-baseline gap-3 mb-6">
            <h2 className="font-cormorant font-light text-brown italic" style={{ fontSize: 'clamp(24px, 3vw, 32px)' }}>
              {group.name}
            </h2>
            {group.date && <span className="text-[13px] text-brown-mid">{formatEventDate(group.date)}</span>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {group.images.map((img) => {
              const index = runningIndex++
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setOpenIndex(index)}
                  className="relative overflow-hidden border-0 p-0 cursor-pointer bg-transparent"
                  style={{ aspectRatio: '1 / 1' }}
                  aria-label={`Open image: ${img.alt}`}
                >
                  <Image
                    src={urlFor(img.image).width(500).url()}
                    alt={img.alt}
                    fill
                    className={`object-cover ${img.position || 'object-center'} transition-transform duration-300 hover:scale-105`}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    loading="lazy"
                  />
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={open.alt}
          className="fixed inset-0 flex items-center justify-center p-6"
          style={{ background: 'rgba(18,8,2,0.92)', zIndex: 200 }}
          onClick={() => setOpenIndex(null)}
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setOpenIndex(null)
            }}
            aria-label="Close"
            className="fixed top-6 right-6 text-cream text-[28px] leading-none bg-transparent border-0 cursor-pointer"
            style={{ zIndex: 201 }}
          >
            &times;
          </button>
          <div
            className="relative w-full h-full"
            style={{ maxWidth: '1000px', maxHeight: '80vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={urlFor(open.image).width(1400).url()}
              alt={open.alt}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          {open.caption && (
            <p
              className="fixed left-0 right-0 text-center font-cormorant italic text-gold-pale text-[15px]"
              style={{ bottom: '24px', zIndex: 201 }}
            >
              {open.caption}
            </p>
          )}
        </div>
      )}
    </>
  )
}
