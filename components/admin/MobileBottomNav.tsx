'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const TABS = [
  { label: 'Today', href: '/admin/today', icon: '◎' },
  { label: 'Pipeline', href: '/admin/pipeline', icon: '⟳' },
  { label: 'Drafts', href: '/admin/drafts', icon: '✦' },
  { label: 'Leads', href: '/admin/leads', icon: '◈' },
  { label: 'More', href: null, icon: '···' },
]

const MORE_LINKS = [
  { label: 'Settings', href: '/admin/settings', icon: '⚙' },
  { label: 'Integrations', href: '/admin/integrations', icon: '⊞' },
  { label: 'Content', href: '/admin/content', icon: '✐' },
  { label: 'Docs', href: '/admin/docs', icon: '?' },
]

export default function MobileBottomNav({ className }: { className?: string }) {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)
  const [draftCount, setDraftCount] = useState(0)

  useEffect(() => {
    fetch('/api/admin/drafts')
      .then(r => r.ok ? r.json() : [])
      .then((d: unknown[]) => setDraftCount(d.length))
      .catch(() => {})
  }, [pathname])

  return (
    <>
      {showMore && (
        <div
          onClick={() => setShowMore(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 199 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', bottom: 68, left: 0, right: 0,
              background: '#fff', borderTop: '1px solid #eee5d7',
              borderRadius: '16px 16px 0 0', padding: '16px 0',
            }}
          >
            {MORE_LINKS.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setShowMore(false)}
                style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 24px', fontSize: 15, color: 'var(--brown)',
                  borderBottom: '1px solid #f5ede0',
                }}>
                  <span style={{ fontSize: 14, opacity: 0.6, width: 20 }}>{l.icon}</span>
                  {l.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <nav className={className} style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 60,
        background: '#fff', borderTop: '1px solid #eee5d7',
        zIndex: 200, justifyContent: 'space-around', alignItems: 'center',
      }}>
        {TABS.map(tab => {
          const active = tab.href ? (pathname === tab.href || pathname.startsWith(tab.href + '/')) : showMore
          const isDrafts = tab.label === 'Drafts'

          if (tab.href === null) {
            return (
              <button
                key="more"
                onClick={() => setShowMore(s => !s)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 2, padding: '6px 12px', border: 'none', background: 'none',
                  cursor: 'pointer', color: active ? 'var(--gold)' : '#9a7d5a',
                  fontSize: 11, fontWeight: active ? 600 : 400,
                }}
              >
                <span style={{ fontSize: 15 }}>{tab.icon}</span>
                {tab.label}
              </button>
            )
          }

          return (
            <Link key={tab.href} href={tab.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 2, padding: '6px 12px', position: 'relative',
                color: active ? 'var(--gold)' : '#9a7d5a',
                fontSize: 11, fontWeight: active ? 600 : 400,
              }}>
                <span style={{ fontSize: 15 }}>{tab.icon}</span>
                {tab.label}
                {isDrafts && draftCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 2, right: 4,
                    background: 'var(--gold)', color: '#fff',
                    borderRadius: 8, fontSize: 9, fontWeight: 700,
                    padding: '1px 5px', lineHeight: 1.4,
                  }}>{draftCount}</span>
                )}
              </div>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
