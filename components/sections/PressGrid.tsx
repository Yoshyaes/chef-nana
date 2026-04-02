import FadeIn from '@/components/ui/FadeIn'
import SectionLabel from '@/components/ui/SectionLabel'

const defaultPublications = [
  {
    name: 'Bon Appétit',
    href: 'https://www.bonappetit.com/story/line-cook-nycs-fanciest-restaurants?srsltid=AfmBOooa_tBf1KIhihGltwR7Jv8MLSBXOow92v-QGn3B7HOslZKkJ74w',
  },
  {
    name: 'The New York Times',
    href: 'https://www.nytimes.com/2021/01/11/dining/black-women-fine-dining-restaurant-kitchens.html',
  },
  {
    name: 'Forbes',
    href: 'https://www.forbes.com/sites/andywang/2023/07/27/james-beard-foundations-platform-celebrates-black-culinary-excellence/',
  },
  {
    name: 'Eater',
    href: 'https://www.eater.com/23617676/west-african-fine-dining-restaurants-in-america',
  },
  {
    name: 'Cherry Bombe',
    href: 'https://cherrybombe.com/blogs/radio-cherry-bombe/chefs-nana-wilmot-and-lana-lagomarsini-are-redefining-fine-dining',
  },
  {
    name: 'Bravo · Top Chef S23',
    href: 'https://www.bravotv.com/people/nana-araba-wilmot',
  },
]

interface PressGridProps {
  pressItems?: { name: string; href: string }[] | null
}

export default function PressGrid({ pressItems }: PressGridProps) {
  const publications = pressItems?.length ? pressItems : defaultPublications
  return (
    <section
      id="press"
      className="bg-brown relative"
      style={{
        paddingLeft: 'clamp(24px, 4.2vw, 60px)',
        paddingRight: 'clamp(24px, 4.2vw, 60px)',
        paddingTop: 'clamp(60px, 7vw, 100px)',
        paddingBottom: 'clamp(60px, 7vw, 100px)',
      }}
    >
      {/* Top border */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(201,151,58,0.3), transparent)',
        }}
      />
      {/* Bottom border */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(201,151,58,0.3), transparent)',
        }}
      />

      {/* Header */}
      <FadeIn>
        <div className="text-center" style={{ marginBottom: '60px' }}>
          <SectionLabel color="gold" center>
            As Seen In
          </SectionLabel>
          <h2 className="font-cormorant font-light text-cream mt-4" style={{ fontSize: 'clamp(36px, 5vw, 52px)' }}>
            Press &amp; Recognition
          </h2>
        </div>
      </FadeIn>

      {/* Logo Grid */}
      <FadeIn delay={0.1}>
        <div
          className="flex justify-center flex-wrap"
          style={{ gap: '1px', marginBottom: '60px' }}
        >
          {publications.map((pub) => (
            <a
              key={pub.name}
              href={pub.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-gold/10 flex items-center justify-center transition-colors duration-300 hover:bg-gold/[0.06] no-underline"
              style={{ paddingLeft: 'clamp(20px, 4vw, 48px)', paddingRight: 'clamp(20px, 4vw, 48px)', paddingTop: '28px', paddingBottom: '28px' }}
            >
              <span className="font-cormorant text-[22px] italic tracking-[0.08em] text-cream/35 font-normal whitespace-nowrap transition-colors duration-300 group-hover:text-gold/70">
                {pub.name}
              </span>
            </a>
          ))}
        </div>
      </FadeIn>
    </section>
  )
}
