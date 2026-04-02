export const metadata = {
  title: 'Admin — Chef Nana Website',
  robots: 'noindex, nofollow',
}

const links = [
  {
    title: 'Content Studio',
    description: 'Edit events, services, gallery, press, and site copy',
    href: '/studio',
    color: '#C9973A',
  },
  {
    title: 'Newsletter & Contacts',
    description: 'View subscribers and send broadcasts',
    href: 'https://resend.com/audience',
    color: '#2D5F3D',
  },
  {
    title: 'Analytics',
    description: 'View website traffic and visitor insights',
    href: 'https://analytics.google.com',
    color: '#B85A35',
  },
  {
    title: 'Vercel Dashboard',
    description: 'Deployment status and domain settings',
    href: 'https://vercel.com',
    color: '#2C1A0E',
  },
]

export default function AdminPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F7F1E8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '80px 24px',
        fontFamily: 'Georgia, serif',
      }}
    >
      <h1 style={{ fontSize: '36px', fontWeight: 300, color: '#2C1A0E', marginBottom: '8px' }}>
        Chef Nana — Admin
      </h1>
      <p style={{ fontSize: '14px', color: '#5C3A22', marginBottom: '48px', fontStyle: 'italic' }}>
        Manage your website content and view analytics
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          maxWidth: '700px',
          width: '100%',
        }}
      >
        {links.map((link) => (
          <a
            key={link.title}
            href={link.href}
            target={link.href.startsWith('/') ? undefined : '_blank'}
            rel={link.href.startsWith('/') ? undefined : 'noopener noreferrer'}
            style={{
              display: 'block',
              padding: '28px 24px',
              background: 'white',
              border: '1px solid rgba(201,151,58,0.15)',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: link.color,
                marginBottom: '14px',
              }}
            />
            <div style={{ fontSize: '20px', color: '#2C1A0E', marginBottom: '6px' }}>
              {link.title}
              {!link.href.startsWith('/') && (
                <span style={{ fontSize: '12px', marginLeft: '6px', opacity: 0.4 }}>↗</span>
              )}
            </div>
            <div style={{ fontSize: '13px', color: '#5C3A22', lineHeight: 1.5 }}>
              {link.description}
            </div>
          </a>
        ))}
      </div>

      <p
        style={{
          marginTop: '48px',
          fontSize: '11px',
          color: '#5C3A22',
          opacity: 0.5,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
        }}
      >
        chefnanawilmot.com
      </p>
    </div>
  )
}
