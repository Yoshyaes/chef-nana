'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useDraftsList } from '@/hooks/admin/useDrafts'
import { useApiSpend } from '@/hooks/admin/useApiSpend'
import { createClient } from '@/lib/supabase/client'
import BottomSheet from '@/components/admin/ui/BottomSheet'

const TABS = [
  { label: 'Today', href: '/admin/today', icon: '◎' },
  { label: 'Pipeline', href: '/admin/pipeline', icon: '⟳' },
  { label: 'Drafts', href: '/admin/drafts', icon: '✦' },
  { label: 'Leads', href: '/admin/leads', icon: '◈' },
  { label: 'More', href: null, icon: '···' },
]

const MORE_LINKS = [
  { label: 'Tasks', href: '/admin/tasks', icon: '☑' },
  { label: 'Sequences', href: '/admin/sequences', icon: '→' },
  { label: 'Menus', href: '/admin/menus', icon: '◫' },
  { label: 'Content', href: '/admin/content', icon: '✐' },
  { label: 'Integrations', href: '/admin/integrations', icon: '⊞' },
  { label: 'Settings', href: '/admin/settings', icon: '⚙' },
  { label: 'Docs', href: '/admin/docs', icon: '?' },
]

export default function MobileBottomNav({ className }: { className?: string }) {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)
  const draftCount = useDraftsList().data?.length ?? 0
  const spend = useApiSpend().data ?? { current: 0, cap: 25 }
  const spendPct = Math.min(100, (spend.current / spend.cap) * 100)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  return (
    <>
      <nav className={className} style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 60,
        background: 'var(--surface)', borderTop: '1px solid var(--border-hairline)',
        zIndex: 200, justifyContent: 'space-around', alignItems: 'center',
        paddingBottom: 'env(safe-area-inset-bottom)',
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
                  cursor: 'pointer', color: active ? 'var(--gold)' : 'var(--text-muted)',
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
                color: active ? 'var(--gold)' : 'var(--text-muted)',
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

      <BottomSheet open={showMore} onOpenChange={setShowMore} title="More">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {MORE_LINKS.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setShowMore(false)} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '13px 4px', fontSize: 15, color: 'var(--brown)',
                borderBottom: '1px solid var(--chip-bg)',
              }}>
                <span style={{ fontSize: 14, opacity: 0.6, width: 20 }}>{l.icon}</span>
                {l.label}
              </div>
            </Link>
          ))}

          <div style={{ padding: '16px 4px 8px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>API this month</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--brown)', marginBottom: 6 }}>
              <span>${spend.current.toFixed(2)}</span>
              <span style={{ opacity: 0.5 }}>${spend.cap} cap</span>
            </div>
            <div style={{ height: 4, background: 'var(--chip-bg)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${spendPct}%`, background: spendPct >= 80 ? 'var(--danger)' : 'var(--gold)', borderRadius: 2 }} />
            </div>
          </div>

          <button
            onClick={handleSignOut}
            style={{
              marginTop: 8, padding: '13px 4px', fontSize: 14, color: 'var(--danger)',
              background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </BottomSheet>
    </>
  )
}
