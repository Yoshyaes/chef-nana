import Hero from '@/components/sections/Hero'
import PressBar from '@/components/sections/PressBar'
import About from '@/components/sections/About'
import Services from '@/components/sections/Services'
import SupperClub from '@/components/sections/SupperClub'
import Gallery from '@/components/sections/Gallery'
import PressGrid from '@/components/sections/PressGrid'
import Newsletter from '@/components/sections/Newsletter'
import Booking from '@/components/sections/Booking'

export default function Home() {
  return (
    <main>
      <Hero />
      <PressBar />
      <About />
      <Services />
      <SupperClub />
      <Gallery />
      <PressGrid />
      <Newsletter />
      <Booking />
    </main>
  )
}
