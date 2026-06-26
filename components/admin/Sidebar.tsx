'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Counts { drafts: number; leads: number; tasks: number }

const navItems = [
  { label: 'Today', href: '/admin/today', icon: '◎', countKey: 'tasks' as keyof Counts },
  { label: 'Pipeline', href: '/admin/pipeline', icon: '⟳', countKey: 'leads' as keyof Counts },
  { label: 'Drafts', href: '/admin/drafts', icon: '✦', countKey: 'drafts' as keyof Counts },
  { label: 'Leads', href: '/admin/leads', icon: '◈', countKey: null },
  { label: 'Sequences', href: '/admin/sequences', icon: '→', countKey: null },
]

const toolItems = [
  { label: 'Content', href: '/admin/content', icon: '✐', external: false },
  { label: 'Integrations', href: '/admin/integrations', icon: '⊞', external: false },
  { label: 'Settings', href: '/admin/settings', icon: '⚙', external: false },
  { label: 'Docs', href: '/admin/docs', icon: '?', external: false },
]

export default function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const [counts, setCounts] = useState<Counts>({ drafts: 0, leads: 0, tasks: 0 })
  const [spend, setSpend] = useState<{ current: number; cap: number }>({ current: 0, cap: 25 })

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setSpend({ current: d.current_month_spend ?? 0, cap: d.monthly_budget_cap ?? 25 }) })
      .catch(() => {})

    fetch('/api/admin/drafts')
      .then(r => r.ok ? r.json() : [])
      .then((d: unknown[]) => setCounts(c => ({ ...c, drafts: d.length })))
      .catch(() => {})
  }, [pathname])

  const spendPct = Math.min(100, (spend.current / spend.cap) * 100)

  return (
    <aside className={className} style={{
      width: 244,
      background: '#fff',
      borderRight: '1px solid #eee5d7',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      flexShrink: 0,
    }}>
      {/* Brand */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #eee5d7' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--brown)', lineHeight: 1.3 }}>
          Georgina&apos;s Assistant
        </div>
        <div style={{ fontSize: 11, color: '#9a7d5a', marginTop: 2, letterSpacing: '0.06em' }}>
          LEAD STUDIO
        </div>
      </div>

      {/* Workspace nav */}
      <nav style={{ padding: '16px 12px 8px', flex: 1 }}>
        <div style={{ fontSize: 10, color: '#9a7d5a', letterSpacing: '0.1em', padding: '0 8px 8px', textTransform: 'uppercase' }}>
          Workspace
        </div>
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const badge = item.countKey ? counts[item.countKey] : 0
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
                color: active ? 'var(--brown)' : '#5c3a22',
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

        <div style={{ fontSize: 10, color: '#9a7d5a', letterSpacing: '0.1em', padding: '16px 8px 8px', textTransform: 'uppercase' }}>
          Tools
        </div>
        {toolItems.map(item => {
          const active = pathname === item.href
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
                color: '#5c3a22',
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
      <div style={{ padding: '16px 20px', borderTop: '1px solid #eee5d7' }}>
        <div style={{ fontSize: 11, color: '#9a7d5a', marginBottom: 6 }}>
          API this month
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--brown)', marginBottom: 6 }}>
          <span>${spend.current.toFixed(2)}</span>
          <span style={{ opacity: 0.5 }}>${spend.cap} cap</span>
        </div>
        <div style={{ height: 4, background: '#f0e8db', borderRadius: 2, overflow: 'hidden' }}>
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
            background: 'var(--gold)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 600,
          }}>N</div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--brown)', fontWeight: 500 }}>Nana Wilmot</div>
            <div style={{ fontSize: 11, color: '#9a7d5a' }}>Chef · Owner</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
