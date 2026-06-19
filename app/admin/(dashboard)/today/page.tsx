'use client'

import { useEffect, useState } from 'react'

interface TriageAction {
  priority: 'hot' | 'warm' | 'cool'
  type: string
  title: string
  description: string
  leadId?: string
  draftId?: string
}

interface Triage {
  tldr: string
  actions: TriageAction[]
  stats: { hotReplies: number; draftsToApprove: number; followUpsDue: number; activeLeads: number }
  generated_at: string
}

const priorityColor: Record<string, string> = {
  hot: '#B85A35',
  warm: '#C9973A',
  cool: '#7a6652',
}

const typeLabel: Record<string, string> = {
  reply: 'Reply',
  approve: 'Approve',
  followup: 'Follow-up',
  inquiry: 'Inquiry',
}

export default function TodayPage() {
  const [triage, setTriage] = useState<Triage | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetch('/api/admin/triage')
      .then(r => r.ok ? r.json() : null)
      .then(setTriage)
      .finally(() => setLoading(false))
  }, [])

  async function generateTriage() {
    setGenerating(true)
    await fetch('/api/admin/triage', { method: 'POST' })
    setTimeout(() => {
      fetch('/api/admin/triage').then(r => r.json()).then(setTriage).finally(() => setGenerating(false))
    }, 8000)
  }

  if (loading) return <div style={{ color: '#9a7d5a', padding: 40 }}>Loading…</div>

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--brown)', fontWeight: 400 }}>
            Good morning, Nana
          </h1>
          {triage?.generated_at && (
            <div style={{ fontSize: 12, color: '#9a7d5a', marginTop: 4 }}>
              Brief from {new Date(triage.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
        <button
          onClick={generateTriage}
          disabled={generating}
          style={{
            padding: '8px 16px', background: generating ? '#e5d9c9' : 'var(--gold)',
            color: generating ? '#9a7d5a' : '#fff', border: 'none', borderRadius: 8,
            fontSize: 13, cursor: generating ? 'not-allowed' : 'pointer', fontWeight: 500,
          }}
        >
          {generating ? 'Generating…' : 'Refresh brief'}
        </button>
      </div>

      {!triage ? (
        <div style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--brown)', marginBottom: 8 }}>
            No brief yet
          </div>
          <p style={{ color: '#9a7d5a', fontSize: 14, marginBottom: 20 }}>
            Add some leads and click &ldquo;Refresh brief&rdquo; to generate your first morning summary.
          </p>
        </div>
      ) : (
        <>
          {triage.stats && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Hot replies', value: triage.stats.hotReplies, color: '#B85A35' },
                { label: 'Drafts to approve', value: triage.stats.draftsToApprove, color: '#C9973A' },
                { label: 'Follow-ups due', value: triage.stats.followUpsDue, color: '#7a6652' },
                { label: 'Active leads', value: triage.stats.activeLeads, color: '#2D5F3D' },
              ].map(s => (
                <div key={s.label} style={{
                  flex: 1, background: '#fff', border: '1px solid #eee5d7',
                  borderRadius: 10, padding: '14px 16px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#9a7d5a', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{
            background: '#fff', border: '1px solid #eee5d7', borderRadius: 12,
            padding: 24, marginBottom: 24,
          }}>
            <div style={{ fontSize: 11, color: '#9a7d5a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              TLDR
            </div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--brown)', lineHeight: 1.7 }}>
              {triage.tldr}
            </p>
          </div>

          {triage.actions?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: '#9a7d5a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                Needs you first
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {triage.actions.map((action, i) => (
                  <div key={i} style={{
                    background: '#fff', border: '1px solid #eee5d7', borderRadius: 10,
                    padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: priorityColor[action.priority] ?? '#ccc', flexShrink: 0,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: 'var(--brown)', fontWeight: 500 }}>{action.title}</div>
                      <div style={{ fontSize: 12, color: '#9a7d5a', marginTop: 2 }}>{action.description}</div>
                    </div>
                    <div style={{
                      fontSize: 11, color: priorityColor[action.priority] ?? '#ccc',
                      background: `${priorityColor[action.priority]}18`,
                      padding: '3px 8px', borderRadius: 6, fontWeight: 500,
                    }}>
                      {typeLabel[action.type] ?? action.type}
                    </div>
                    {action.draftId && (
                      <a href={`/admin/drafts?highlight=${action.draftId}`} style={{
                        fontSize: 12, color: 'var(--gold)', textDecoration: 'none', fontWeight: 500,
                      }}>Review →</a>
                    )}
                    {action.leadId && !action.draftId && (
                      <a href={`/admin/leads/${action.leadId}`} style={{
                        fontSize: 12, color: 'var(--gold)', textDecoration: 'none', fontWeight: 500,
                      }}>View →</a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
