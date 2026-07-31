import Link from 'next/link'

export default function ConfirmedPage() {
  return (
    <section
      className="min-h-[60vh] bg-cream-dark flex flex-col items-center justify-center text-center"
      style={{
        paddingLeft: 'clamp(24px, 6vw, 80px)',
        paddingRight: 'clamp(24px, 6vw, 80px)',
        paddingTop: 'clamp(96px, 10vw, 140px)',
        paddingBottom: 'clamp(64px, 8vw, 100px)',
      }}
    >
      <h1
        className="font-cormorant font-light text-brown leading-[1.15] mb-4"
        style={{ fontSize: 'clamp(36px, 5vw, 54px)' }}
      >
        You&apos;re in!
      </h1>
      <p className="text-[18px] leading-[1.85] text-brown-mid font-light mb-8" style={{ maxWidth: '480px' }}>
        Your payment went through. Check your email for a confirmation with your ticket details.
      </p>
      <Link href="/" className="text-[13px] tracking-[0.18em] uppercase text-green hover:text-green-light">
        Back to the site
      </Link>
    </section>
  )
}
