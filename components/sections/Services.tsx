import FadeIn from '@/components/ui/FadeIn'
import SectionLabel from '@/components/ui/SectionLabel'
import ServiceCard from '@/components/ui/ServiceCard'

const services = [
  {
    number: '01',
    title: 'Private Chef & Dining',
    description:
      'Intimate dinners for 2, milestone celebrations for 50. Fully custom menus rooted in West African tradition with fine-dining precision.',
    linkText: 'Inquire →',
    href: '#booking',
  },
  {
    number: '02',
    title: 'Full-Service Catering',
    description:
      'Weddings, corporate events, brunches, graduations. Full team. Full service. Flavors that your guests will remember for years.',
    linkText: 'Inquire →',
    href: '#booking',
  },
  {
    number: '03',
    title: 'Travel Chef',
    description:
      'New York · Philadelphia · Accra. Nana brings her kitchen to you — wherever you are. Available for destination events and residential residencies.',
    linkText: 'Inquire →',
    href: '#booking',
  },
  {
    number: '04',
    title: 'Love That I Knead Supper Club',
    description:
      'Ticketed West African-inspired dinner experiences. Intimate, communal, and soulful — from Brooklyn lofts to Accra terraces.',
    linkText: 'See Upcoming Dates →',
    href: '#supper',
  },
  {
    number: '05',
    title: 'Menu Consulting & Education',
    description:
      'Menu development, culinary education, and cooking experiences for restaurants, institutions, and private clients seeking cultural depth.',
    linkText: 'Inquire →',
    href: '#booking',
  },
  {
    number: '06',
    title: 'Shop (Coming Soon)',
    description:
      'Sauces, spice blends, and culinary products bringing West African pantry essentials to your home kitchen.',
    linkText: 'Join the Waitlist →',
    href: '#newsletter',
  },
]

export default function Services() {
  return (
    <section
      id="services"
      className="bg-brown relative overflow-hidden"
      style={{
        paddingLeft: 'clamp(24px, 4.2vw, 60px)',
        paddingRight: 'clamp(24px, 4.2vw, 60px)',
        paddingTop: 'clamp(64px, 8.5vw, 120px)',
        paddingBottom: 'clamp(64px, 8.5vw, 120px)',
      }}
    >
      {/* Top gold gradient line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(to right, transparent, var(--gold), transparent)',
        }}
      />

      {/* Header */}
      <FadeIn>
        <div className="text-center mb-20">
          <SectionLabel color="gold" center>
            What Nana Offers
          </SectionLabel>
          <h2
            className="font-cormorant font-light text-cream leading-[1.1]"
            style={{ fontSize: 'clamp(40px, 5vw, 64px)' }}
          >
            Extraordinary meals.
            <br />
            <em className="italic text-gold-light">Every occasion.</em>
          </h2>
        </div>
      </FadeIn>

      {/* Services Grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        style={{ maxWidth: '1100px', marginLeft: 'auto', marginRight: 'auto', gap: '2px' }}
      >
        {services.map((service, i) => (
          <FadeIn key={service.number} delay={(i % 3) * 0.1} className="h-full">
            <ServiceCard {...service} />
          </FadeIn>
        ))}
      </div>
    </section>
  )
}
