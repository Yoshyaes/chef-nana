import Hero from '@/components/sections/Hero'
import PressBar from '@/components/sections/PressBar'
import About from '@/components/sections/About'
import Services from '@/components/sections/Services'
import SupperClub from '@/components/sections/SupperClub'
import Gallery from '@/components/sections/Gallery'
import PressGrid from '@/components/sections/PressGrid'
import Newsletter from '@/components/sections/Newsletter'
import Booking from '@/components/sections/Booking'
import {
  getEvents,
  getServices,
  getCredentials,
  getGalleryImages,
  getPressItems,
  getSiteSettings,
} from '@/lib/queries'

export const revalidate = 60 // ISR: revalidate every 60s as a safety net

export default async function Home() {
  // Fetch all CMS data in parallel — fall back to defaults if Sanity is unavailable
  const [events, services, credentials, galleryImages, pressItems, siteSettings] =
    await Promise.all([
      getEvents().catch(() => null),
      getServices().catch(() => null),
      getCredentials().catch(() => null),
      getGalleryImages().catch(() => null),
      getPressItems().catch(() => null),
      getSiteSettings().catch(() => null),
    ])

  return (
    <main>
      <Hero siteSettings={siteSettings} />
      <PressBar pressItems={pressItems} />
      <About credentials={credentials} siteSettings={siteSettings} />
      <Services services={services} />
      <SupperClub events={events} siteSettings={siteSettings} />
      <Gallery galleryImages={galleryImages} />
      <PressGrid pressItems={pressItems} />
      <Newsletter />
      <Booking />
    </main>
  )
}
