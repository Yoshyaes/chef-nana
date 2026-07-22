'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import Button from '@/components/admin/ui/Button'
import { SkeletonCard } from '@/components/admin/ui/Skeleton'

interface VercelDeploy { state: string; created: number; commitMessage: string | null; url: string | null }
interface VercelData { latest: VercelDeploy | null; recent: VercelDeploy[] }
interface GA4Data {
  last7Days: { pageViews: number; sessions: number; activeUsers: number }
  last30Days: { pageViews: number; sessions: number }
}
interface SanityData { events: number; services: number; credentials: number; press: number }
interface EmailData { sentThisMonth: number; totalSent: number; pendingDrafts: number }
interface Data { vercel: VercelData | null; ga4: GA4Data | null; ga4Error: string | null; sanity: SanityData | null; emails: EmailData | null }

function stateColor(s: string) {
  return s === 'READY' ? 'var(--success)' : s === 'ERROR' || s === 'FAILED' ? 'var(--danger)' : s === 'BUILDING' ? 'var(--gold)' : 'var(--text-muted)'
}
function stateLabel(s: string) {
  return s === 'READY' ? '● Live' : s === 'ERROR' || s === 'FAILED' ? '● Failed' : s === 'BUILDING' ? '● Building…' : s === 'CANCELED' ? '○ Canceled' : s
}
function timeAgo(ms: number) {
  const m = Math.floor((Date.now() - ms) / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 26, fontWeight: 600, color: 'var(--brown)', lineHeight: 1 }}>{value.toLocaleString()}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  )
}

function IntegrationCard({ title, icon, href, hrefLabel, children, unconfigured, configError }: {
  title: string; icon: string; href: string; hrefLabel: string
  children?: React.ReactNode; unconfigured?: boolean; configError?: string
}) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 12, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontWeight: 500, color: 'var(--brown)', fontSize: 15 }}>{title}</span>
        </div>
        <a href={href} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 12, color: 'var(--gold)', textDecoration: 'none' }}>{hrefLabel} ↗</a>
      </div>
      {unconfigured ? (
        <div style={{ fontSize: 13, color: configError ? 'var(--danger)' : 'var(--text-muted)', background: configError ? '#fdf2f0' : 'var(--surface-alt)', borderRadius: 8, padding: '10px 14px' }}>
          {configError ?? 'Not configured — add environment variables to enable.'}
        </div>
      ) : children}
    </div>
  )
}

export default function IntegrationsPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshed, setRefreshed] = useState<Date | null>(null)

  function load() {
    setLoading(true)
    return fetch('/api/admin/integrations')
      .then(r => r.json())
      .then(d => { setData(d); setRefreshed(new Date()); setLoading(false) })
      .catch(() => setLoading(false))
  }

  // Initial fetch on mount, written without going through load() so this
  // effect's body never calls setState synchronously (loading is already
  // true by its initial useState value) — load() itself is only ever
  // invoked afterward from the Refresh button / pull-to-refresh handlers.
  useEffect(() => {
    fetch('/api/admin/integrations')
      .then(r => r.json())
      .then(d => { setData(d); setRefreshed(new Date()); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const { pullDistance, refreshing, handlers } = usePullToRefresh(() => load())

  return (
    <div style={{ maxWidth: 920 }} {...handlers}>
      {(pullDistance > 0 || refreshing) && (
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', height: pullDistance, overflow: 'hidden' }}>
          {refreshing ? 'Refreshing…' : '↓ Pull to refresh'}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--brown)', fontWeight: 500, marginBottom: 4 }}>
            Integrations
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Live stats from connected services
            {refreshed && <> · last refreshed {refreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>}
          </p>
        </div>
        <Button size="sm" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</Button>
      </div>

      {loading && !data ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          <IntegrationCard title="Google Analytics" icon="📊" href="https://analytics.google.com" hrefLabel="Open GA4" unconfigured={!data?.ga4} configError={data?.ga4Error ?? undefined}>
            {data?.ga4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Last 7 days</div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <StatBox label="Page views" value={data.ga4.last7Days.pageViews} />
                    <StatBox label="Sessions" value={data.ga4.last7Days.sessions} />
                    <StatBox label="Users" value={data.ga4.last7Days.activeUsers} />
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--chip-bg)', paddingTop: 16 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Last 30 days</div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <StatBox label="Page views" value={data.ga4.last30Days.pageViews} />
                    <StatBox label="Sessions" value={data.ga4.last30Days.sessions} />
                  </div>
                </div>
              </div>
            )}
          </IntegrationCard>

          <IntegrationCard title="Vercel" icon="▲" href="https://vercel.com/dashboard" hrefLabel="Dashboard" unconfigured={!data?.vercel}>
            {data?.vercel && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {data.vercel.latest && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-alt)', borderRadius: 8, padding: '12px 14px', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: stateColor(data.vercel.latest.state) }}>
                        {stateLabel(data.vercel.latest.state)}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {data.vercel.latest.commitMessage?.slice(0, 50) ?? 'No commit message'} · {timeAgo(data.vercel.latest.created)}
                      </div>
                    </div>
                    {data.vercel.latest.url && (
                      <a href={`https://${data.vercel.latest.url}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, color: 'var(--gold)', textDecoration: 'none', flexShrink: 0 }}>View ↗</a>
                    )}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Recent deploys</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {data.vercel.recent.map((d, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, gap: 12 }}>
                        <span style={{ color: 'var(--text-muted-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.commitMessage ?? '—'}
                        </span>
                        <span style={{ color: stateColor(d.state), flexShrink: 0 }}>
                          {stateLabel(d.state)} · {timeAgo(d.created)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </IntegrationCard>

          <IntegrationCard title="Outreach" icon="✉" href="https://resend.com" hrefLabel="Resend">
            {data?.emails ? (
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <StatBox label="Sent this month" value={data.emails.sentThisMonth} />
                <StatBox label="All time sent" value={data.emails.totalSent} />
                <StatBox label="Pending drafts" value={data.emails.pendingDrafts} />
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No email data yet.</div>
            )}
          </IntegrationCard>

          <IntegrationCard title="Content (Sanity)" icon="✐" href="/studio" hrefLabel="Open Studio">
            {data?.sanity ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <StatBox label="Events" value={data.sanity.events} />
                <StatBox label="Services" value={data.sanity.services} />
                <StatBox label="Credentials" value={data.sanity.credentials} />
                <StatBox label="Press items" value={data.sanity.press} />
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Could not connect to Sanity.</div>
            )}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--chip-bg)' }}>
              <Link href="/admin/content" style={{ fontSize: 12, color: 'var(--gold)', textDecoration: 'none' }}>
                Edit content in admin →
              </Link>
            </div>
          </IntegrationCard>
        </div>
      )}
    </div>
  )
}
