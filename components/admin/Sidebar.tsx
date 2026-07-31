'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { createClient } from '@/lib/supabase/client'
import { useDraftsList } from '@/hooks/admin/useDrafts'
import { useApiSpend } from '@/hooks/admin/useApiSpend'

const navItems = [
  { label: 'Today', href: '/admin/today', icon: '◎', showDraftBadge: false },
  { label: 'Pipeline', href: '/admin/pipeline', icon: '⟳', showDraftBadge: false },
  { label: 'Drafts', href: '/admin/drafts', icon: '✦', showDraftBadge: true },
  { label: 'Leads', href: '/admin/leads', icon: '◈', showDraftBadge: false },
  { label: 'Tasks', href: '/admin/tasks', icon: '☑', showDraftBadge: false },
  { label: 'Sequences', href: '/admin/sequences', icon: '→', showDraftBadge: false },
]

const toolItems = [
  { label: 'Content', href: '/admin/content', icon: '✐', external: false },
  { label: 'Ticketing', href: '/admin/ticketing', icon: '🎟', external: false },
  { label: 'Menus', href: '/admin/menus', icon: '◫', external: false },
  { label: 'Integrations', href: '/admin/integrations', icon: '⊞', external: false },
  { label: 'Settings', href: '/admin/settings', icon: '⚙', external: false },
  { label: 'Docs', href: '/admin/docs', icon: '?', external: false },
]

export default function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const draftCount = useDraftsList().data?.length ?? 0
  const spend = useApiSpend().data ?? { current: 0, cap: 25 }
  const { profile } = useCurrentProfile()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  const spendPct = Math.min(100, (spend.current / spend.cap) * 100)

  return (
    <aside className={className} style={{
      width: 244,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border-hairline)',
      flexDirection: 'column',
      padding: '0',
    }}>
      {/* Brand */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border-hairline)' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--brown)', lineHeight: 1.3 }}>
          Georgina&apos;s Assistant
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, letterSpacing: '0.06em' }}>
          LEAD STUDIO
        </div>
      </div>

      {/* Workspace nav */}
      <nav style={{ padding: '16px 12px 8px', flex: 1 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', padding: '0 8px 8px', textTransform: 'uppercase' }}>
          Workspace
        </div>
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const badge = item.showDraftBadge ? draftCount : 0
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 10px',
                borderRadius: 8,
                marginBottom: 2,
                background: active ? 'rgba(201,151,58,0.1)' : 'transparent',
                borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
                color: active ? 'var(--brown)' : 'var(--text-muted-2)',
                fontSize: 14,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, opacity: 0.6 }}>{item.icon}</span>
                  {item.label}
                </span>
                {badge > 0 && (
                  <span style={{
                    background: 'var(--gold)',
                    color: '#fff',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '1px 7px',
                    minWidth: 20,
                    textAlign: 'center',
                  }}>{badge}</span>
                )}
              </div>
            </Link>
          )
        })}

        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', padding: '16px 8px 8px', textTransform: 'uppercase' }}>
          Tools
        </div>
        {toolItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 10px',
                borderRadius: 8,
                marginBottom: 2,
                background: active ? 'rgba(201,151,58,0.1)' : 'transparent',
                borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
                color: 'var(--text-muted-2)',
                fontSize: 14,
                cursor: 'pointer',
              }}>
                <span style={{ fontSize: 12, opacity: 0.6 }}>{item.icon}</span>
                {item.label}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Usage meter */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-hairline)' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
          API this month
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--brown)', marginBottom: 6 }}>
          <span>${spend.current.toFixed(2)}</span>
          <span style={{ opacity: 0.5 }}>${spend.cap} cap</span>
        </div>
        <div style={{ height: 4, background: 'var(--chip-bg)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${spendPct}%`,
            background: spendPct >= 80 ? 'var(--terracotta)' : 'var(--gold)',
            borderRadius: 2,
            transition: 'width 0.3s',
          }} />
        </div>

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: profile?.avatar_color ?? 'var(--gold)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 600, flexShrink: 0,
          }}>{profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : '?'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: 'var(--brown)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.full_name ?? '...'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {profile?.role ?? ''}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 11,
              cursor: 'pointer',
              padding: '4px 2px',
              flexShrink: 0,
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}
