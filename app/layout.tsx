import type { Metadata } from 'next'
import { Cormorant_Garamond, Jost } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const jost = Jost({
  variable: '--font-jost',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://chefnanawilmot.com'),
  title: 'Chef Nana Araba Wilmot | Private Chef · West African Cuisine · NYC & Philadelphia',
  description:
    'Michelin-trained private chef Nana Araba Wilmot offers private dining, catering, and the Love That I Knead supper club series across New York, Philadelphia, and Accra. As seen on Top Chef Season 23.',
  openGraph: {
    type: 'website',
    url: 'https://chefnanawilmot.com',
    title: 'Chef Nana Araba Wilmot | Private Chef & Supper Club',
    description:
      'Michelin-trained private chef Nana Araba Wilmot offers private dining, catering, and the Love That I Knead supper club series across New York, Philadelphia, and Accra. As seen on Top Chef Season 23.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Chef Nana Araba Wilmot' }],
    siteName: 'Chef Nana Araba Wilmot',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chef Nana Araba Wilmot | Private Chef · West African Cuisine',
    description:
      'Michelin-trained private chef. Love That I Knead supper club. NYC · Philadelphia · Accra. As seen on Top Chef Season 23.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://chefnanawilmot.com',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Nana Araba Wilmot',
  jobTitle: 'Private Chef',
  description:
    'Michelin-trained Ghanaian-American private chef specializing in West African heritage cuisine. Founder of the Love That I Knead supper club series. Top Chef Season 23 contestant.',
  url: 'https://chefnanawilmot.com',
  sameAs: [
    'https://www.instagram.com/georginasfoods',
    'https://www.instagram.com/illnahna',
    'https://exploretock.com/georginas',
  ],
}

const businessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: "Georgina's Private Chef & Catering Co.",
  description:
    'Private chef services, full-service catering, travel chef, and the Love That I Knead supper club series.',
  url: 'https://chefnanawilmot.com',
  email: 'nana@georginasfoods.com',
  areaServed: ['New York', 'Philadelphia', 'Accra'],
  founder: {
    '@type': 'Person',
    name: 'Nana Araba Wilmot',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
        />
      </head>
      <body className="antialiased">
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}</Script>
          </>
        )}
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  )
}
