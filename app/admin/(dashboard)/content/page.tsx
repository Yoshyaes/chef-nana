import Link from 'next/link'

const SECTIONS = [
  { label: 'Events', href: '/admin/content/events', description: 'Upcoming dinners and appearances', icon: '◎' },
  { label: 'Services', href: '/admin/content/services', description: 'Private chef, travel chef, supper club', icon: '✦' },
  { label: 'Credentials', href: '/admin/content/credentials', description: 'Timeline of awards and positions', icon: '◈' },
  { label: 'Press', href: '/admin/content/press', description: 'Press mentions and features', icon: '→' },
  { label: 'Site Settings', href: '/admin/content/site-settings', description: 'Hero tagline, bio, supper club copy', icon: '⚙' },
]

export default function ContentPage() {
  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--brown)', fontWeight: 400 }}>Content</h1>
          <p style={{ fontSize: 13, color: '#9a7d5a', marginTop: 4 }}>Edit your website content directly from here.</p>
        </div>
        <a
          href="/studio"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, color: '#9a7d5a', textDecoration: 'none', border: '1px solid #e5d9c9', padding: '6px 12px', borderRadius: 8 }}
        >
          Open full Studio ↗
        </a>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SECTIONS.map(s => (
          <Link key={s.href} href={s.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff', border: '1px solid #eee5d7', borderRadius: 12,
              padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16,
              transition: 'border-color 0.15s',
            }}>
              <span style={{ fontSize: 16, opacity: 0.5, width: 24, textAlign: 'center' }}>{s.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--brown)', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: '#9a7d5a' }}>{s.description}</div>
              </div>
              <span style={{ fontSize: 16, color: '#c5b09a' }}>›</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
