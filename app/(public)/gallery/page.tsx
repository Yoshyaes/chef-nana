import { getGalleryImages } from '@/lib/queries'
import GalleryGrid from '@/components/GalleryGrid'
import SectionLabel from '@/components/ui/SectionLabel'

export const metadata = {
  title: 'Gallery | Chef Nana Araba',
}

export default async function GalleryPage() {
  const images = (await getGalleryImages().catch(() => null)) ?? []

  return (
    <section
      className="bg-cream min-h-[70vh]"
      style={{
        paddingLeft: 'clamp(24px, 6vw, 80px)',
        paddingRight: 'clamp(24px, 6vw, 80px)',
        paddingTop: 'clamp(96px, 10vw, 140px)',
        paddingBottom: 'clamp(64px, 8vw, 100px)',
      }}
    >
      <div className="mb-12">
        <SectionLabel color="terracotta">Portfolio</SectionLabel>
        <h1 className="font-cormorant font-light text-brown leading-none" style={{ fontSize: 'clamp(36px, 5vw, 54px)' }}>
          The <em className="italic text-terracotta">full</em> gallery
        </h1>
      </div>

      {images.length > 0 ? (
        <GalleryGrid images={images} />
      ) : (
        <p className="text-[15px] text-brown-mid">More photos are on the way.</p>
      )}
    </section>
  )
}
