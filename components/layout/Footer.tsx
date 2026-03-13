import Link from 'next/link'

export default function Footer() {
  return (
    <footer
      className="bg-brown relative"
      style={{
        paddingLeft: 'clamp(24px, 4.2vw, 60px)',
        paddingRight: 'clamp(24px, 4.2vw, 60px)',
        paddingTop: 'clamp(64px, 5vw, 70px)',
        paddingBottom: 'clamp(32px, 3vw, 40px)',
      }}
    >
      {/* Tri-color top border */}
      <div className="absolute top-0 left-0 right-0 gradient-kente" style={{ height: '3px' }} />

      {/* Footer Grid */}
      <div className="footer-grid">
        {/* Brand */}
        <div>
          <Link
            href="/"
            className="font-cormorant text-[24px] font-medium tracking-[0.08em] text-gold-pale no-underline block mb-4"
          >
            Chef <span className="italic text-gold-light">Nana Araba</span>
          </Link>
          <p className="text-[14px] leading-[1.7] text-cream/45 font-light mb-6" style={{ maxWidth: '240px' }}>
            Michelin-trained private chef. West African heritage cuisine reimagined for the modern table.
          </p>
          <div className="flex gap-3">
            {[
              { label: 'ig', href: 'https://instagram.com/georginasfoods' },
              { label: 'fb', href: '#' },
              { label: 'th', href: '#' },
              { label: 'tk', href: '#' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target={href !== '#' ? '_blank' : undefined}
                rel={href !== '#' ? 'noopener noreferrer' : undefined}
                className="border border-gold/30 flex items-center justify-center text-[11px] text-gold/60 font-medium font-jost no-underline transition-all duration-200 hover:bg-gold/10 hover:text-gold-light hover:border-gold"
                style={{ width: '38px', height: '38px' }}
                aria-label={label}
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Navigate */}
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase text-gold font-semibold mb-5">
            Navigate
          </div>
          <ul className="list-none flex flex-col gap-3">
            {[
              { href: '#about', label: 'Her Story' },
              { href: '#services', label: 'Services' },
              { href: '#supper', label: 'Supper Club' },
              { href: '#gallery', label: 'Gallery' },
              { href: '#press', label: 'Press' },
              { href: '#booking', label: 'Book Nana' },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-[13px] text-cream/45 no-underline font-light transition-colors duration-200 hover:text-gold-light"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Services */}
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase text-gold font-semibold mb-5">
            Services
          </div>
          <ul className="list-none flex flex-col gap-3">
            {[
              { href: '#booking', label: 'Private Chef' },
              { href: '#booking', label: 'Catering' },
              { href: '#supper', label: 'Love That I Knead' },
              { href: '#booking', label: 'Travel Chef' },
              { href: '#booking', label: 'Menu Consulting' },
              { href: '#newsletter', label: 'Shop (Soon)' },
            ].map(({ href, label }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="text-[13px] text-cream/45 no-underline font-light transition-colors duration-200 hover:text-gold-light"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase text-gold font-semibold mb-5">
            Contact
          </div>
          <ul className="list-none flex flex-col gap-3">
            <li>
              <a
                href="mailto:nana@georginasfoods.com"
                className="text-[13px] text-cream/45 no-underline font-light transition-colors duration-200 hover:text-gold-light"
              >
                nana@georginasfoods.com
              </a>
            </li>
            <li>
              <Link href="#booking" className="text-[13px] text-cream/45 no-underline font-light transition-colors duration-200 hover:text-gold-light">
                Press Inquiries
              </Link>
            </li>
            <li>
              <a
                href="https://exploretock.com/georginas"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-cream/45 no-underline font-light transition-colors duration-200 hover:text-gold-light"
              >
                Tock Reservations
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com/georginasfoods"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-cream/45 no-underline font-light transition-colors duration-200 hover:text-gold-light"
              >
                @georginasfoods
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com/illnahna"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-cream/45 no-underline font-light transition-colors duration-200 hover:text-gold-light"
              >
                @illnahna
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="border-t border-gold/10 pt-7 flex justify-between items-center">
        <p className="text-[12px] text-cream/25 font-light">
          &copy; 2026 Chef Nana Araba Wilmot &middot; Georgina&rsquo;s Private Chef &amp; Catering Co.
        </p>
        <div className="flex gap-5">
          {['New York', 'Philadelphia', 'Accra'].map((city) => (
            <span
              key={city}
              className="text-[10px] tracking-[0.2em] uppercase text-gold/35"
            >
              {city}
            </span>
          ))}
        </div>
      </div>
    </footer>
  )
}
