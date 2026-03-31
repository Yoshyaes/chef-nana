import Image from 'next/image'
import FadeIn from '@/components/ui/FadeIn'
import SectionLabel from '@/components/ui/SectionLabel'
import CredentialCard from '@/components/ui/CredentialCard'
import Button from '@/components/ui/Button'

const credentials = [
  { year: '2016 – 2019', name: 'Le Coucou, NYC<br>Michelin Star · James Beard' },
  { year: '2023', name: 'Culinarian Award<br>Black Women in Food' },
  { year: '2024', name: '<em>The Contemporary African Kitchen</em><br>Contributor' },
  { year: '2026', name: 'Top Chef Season 23<br>Bravo · Now Airing' },
]

export default function About() {
  return (
    <section
      id="about"
      className="grid grid-cols-1 lg:grid-cols-2"
      style={{ minHeight: '90vh' }}
    >
      {/* Visual Panel — full-bleed portrait */}
      <div className="relative overflow-hidden" style={{ minHeight: '500px' }}>
        {/* Full-bleed image */}
        <Image
          src="/images/nana-portrait.jpg"
          alt="Chef Nana Araba Wilmot cooking"
          fill
          className="object-cover object-center"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />

        {/* Dark gradient for quote legibility */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(18,8,2,0.1) 30%, rgba(18,8,2,0.8) 100%)',
          }}
        />

        {/* Diagonal geo overlay */}
        <div className="absolute top-0 right-0 h-full geo-diagonal" style={{ width: '100px' }} />

        {/* Quote */}
        <div
          className="absolute left-0 right-0 text-center"
          style={{ bottom: 'clamp(32px, 5vw, 70px)', paddingLeft: 'clamp(20px, 4vw, 48px)', paddingRight: 'clamp(20px, 4vw, 48px)' }}
        >
          <p className="font-cormorant text-[24px] italic text-gold-pale leading-[1.5]">
            &ldquo;I always do it for the culture.&rdquo;
          </p>
          <p className="mt-3 text-[11px] tracking-[0.2em] uppercase text-gold/60">
            &mdash; Chef Nana Araba Wilmot
          </p>
        </div>
      </div>

      {/* Content Panel */}
      <div
        className="bg-cream flex flex-col justify-center"
        style={{
          paddingLeft: 'clamp(32px, 5.6vw, 80px)',
          paddingRight: 'clamp(32px, 5.6vw, 80px)',
          paddingTop: 'clamp(64px, 7vw, 100px)',
          paddingBottom: 'clamp(64px, 7vw, 100px)',
        }}
      >
        <FadeIn>
          <SectionLabel color="terracotta">Her Story</SectionLabel>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2
            className="font-cormorant font-light leading-[1.15] text-brown mb-7"
            style={{ fontSize: 'clamp(38px, 4vw, 56px)' }}
          >
            From Accra
            <br />
            to the <em className="italic text-terracotta">Michelin</em>
            <br />
            kitchen &amp; back
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="text-[16px] leading-[1.85] text-brown-mid font-light mb-6" style={{ maxWidth: '480px' }}>
            Nana Araba Wilmot grew up in Cherry Hill, New Jersey — but her culinary roots reach
            back to the kitchens of Accra, Ghana. After graduating from the Art Institute of
            Philadelphia, she trained under Iron Chef José Garcés and went on to cook at Daniel
            Rose&rsquo;s Le Coucou — helping earn its Michelin Star and James Beard Award.
          </p>
          <p className="text-[16px] leading-[1.85] text-brown-mid font-light mb-6" style={{ maxWidth: '480px' }}>
            During the pandemic, Nana returned to Cherry Hill and launched Love That I Knead from
            her backyard — an intimate supper club rooted in West African foodways. Today, she
            operates Georgina&rsquo;s Private Chef &amp; Catering Co. across New York,
            Philadelphia, and Accra.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-9 mb-12">
            {credentials.map((cred) => (
              <CredentialCard key={cred.year} year={cred.year} name={cred.name} />
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <Button variant="primary" href="#booking" className="self-start">
            Book a Private Experience
          </Button>
        </FadeIn>
      </div>
    </section>
  )
}
