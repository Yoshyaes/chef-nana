'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const navLinks = [
    { href: '#about', label: 'Story' },
    { href: '#services', label: 'Services' },
    { href: '#supper', label: 'Supper Club' },
    { href: '#gallery', label: 'Gallery' },
    { href: '#press', label: 'Press' },
  ]

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 flex items-center justify-between transition-[background,padding,backdrop-filter] duration-400"
        style={{
          zIndex: 100,
          paddingTop: scrolled ? '14px' : '22px',
          paddingBottom: scrolled ? '14px' : '22px',
          paddingLeft: 'max(24px, min(60px, 4vw))',
          paddingRight: 'max(24px, min(60px, 4vw))',
          background: scrolled ? 'rgba(28, 12, 4, 0.96)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="font-cormorant text-[20px] font-medium tracking-[0.08em] text-gold-pale no-underline"
        >
          Chef <span className="italic text-gold-light">Nana Araba</span>
        </Link>

        {/* Desktop Links */}
        <ul className="hidden md:flex gap-9 list-none items-center">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-cream text-[12px] font-medium tracking-[0.18em] uppercase opacity-85 transition-[opacity,color] duration-200 hover:opacity-100 hover:text-gold-light no-underline"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="#booking"
              className="bg-gold text-brown text-[12px] font-semibold tracking-[0.18em] uppercase py-2.5 no-underline transition-colors duration-200 hover:bg-gold-light"
            style={{ paddingLeft: '22px', paddingRight: '22px' }}
            >
              Book Nana
            </Link>
          </li>
        </ul>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden flex flex-col p-2 cursor-pointer bg-transparent border-0"
          style={{ gap: '5px' }}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <span
            className="block w-6 bg-cream transition-transform duration-300"
            style={{ height: '1.5px', transform: menuOpen ? 'rotate(45deg) translate(4.5px, 4.5px)' : 'none' }}
          />
          <span
            className="block w-6 bg-cream transition-opacity duration-300"
            style={{ height: '1.5px', opacity: menuOpen ? 0 : 1 }}
          />
          <span
            className="block w-6 bg-cream transition-transform duration-300"
            style={{ height: '1.5px', transform: menuOpen ? 'rotate(-45deg) translate(4.5px, -4.5px)' : 'none' }}
          />
        </button>
      </nav>

      {/* Mobile Full-Screen Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 bg-brown flex flex-col items-center justify-center gap-8" style={{ zIndex: 99 }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-cormorant text-[32px] font-light text-cream italic tracking-wide no-underline hover:text-gold-light transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="#booking"
            className="mt-4 bg-gold text-brown text-[12px] font-semibold tracking-[0.18em] uppercase px-9 py-4 no-underline hover:bg-gold-light transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Book Nana
          </Link>
        </div>
      )}
    </>
  )
}
