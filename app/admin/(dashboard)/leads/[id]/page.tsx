'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Lead { id: string; name: string; organization: string; type: string; market: string; email: string | null; linkedin_url: string | null; fit_score: number | null; est_annual_value: number | null; stage: string; is_recurring: boolean }
interface Enrichment { research_brief: string | null; research_sources: string[] | null; provider: string }
interface Message { id: string; direction: string; channel: string; subject: string | null; body: string; sent_at: string }
interface Draft { id: string; subject: string | null; status: string; created_at: string }

const STAGES = ['sourced', 'contacted', 'responded', 'negotiating', 'won', 'lost', 'nurture']

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [lead, setLead] = useState<Lead | null>(null)
  const [enrichment, setEnrichment] = useState<Enrichment[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [researching, setResearching] = useState(false)
  const [drafting, setDrafting] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/leads/${id}`)
      .then(r => r.json())
      .then(d => {
        setLead(d.lead)
        setEnrichment(d.enrichment ?? [])
        setMessages(d.messages ?? [])
        setDrafts(d.drafts ?? [])
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleResearch() {
    setResearching(true)
    await fetch(`/api/admin/leads/${id}/research`, { method: 'POST' })
    setResearching(false)
    alert('Research queued — check back in ~30 seconds')
  }

  async function handleDraft() {
    setDrafting(true)
    await fetch(`/api/admin/leads/${id}/research`, { method: 'POST' })
    setDrafting(false)
    alert('Draft queued — check Drafts in ~30 seconds')
  }

  async function handleStageChange(stage: string) {
    await fetch(`/api/admin/leads/${id}/stage`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage }) })
    setLead(prev => prev ? { ...prev, stage } : null)
  }

  const research = enrichment.find(e => e.provider === 'claude')

  if (loading) return <div style={{ color: '#9a7d5a', padding: 40 }}>Loading…</div>
  if (!lead) return <div style={{ color: '#B85A35', padding: 40 }}>Lead not found.</div>

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <Link href="/admin/leads" style={{ fontSize: 13, color: '#9a7d5a', textDecoration: 'none' }}>← All leads</Link>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--brown)', fontWeight: 400 }}>{lead.name}</h1>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {lead.organization && <span style={{ fontSize: 13, color: '#7a6652' }}>{lead.organization}</span>}
              {lead.market && <span style={{ fontSize: 12, background: '#f5ede0', color: '#7a6652', padding: '2px 8px', borderRadius: 6 }}>{lead.market}</span>}
              {lead.type && <span style={{ fontSize: 12, background: '#f5ede0', color: '#7a6652', padding: '2px 8px', borderRadius: 6 }}>{lead.type}</span>}
              {lead.fit_score != null && <span style={{ fontSize: 12, background: lead.fit_score >= 80 ? '#e8f0ea' : '#fdf4e7', color: lead.fit_score >= 80 ? '#2D5F3D' : '#C9973A', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>{lead.fit_score} fit</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <button onClick={handleResearch} disabled={researching}
              style={{ padding: '8px 16px', background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
              {researching ? 'Queuing…' : '⟳ Research'}
            </button>
            <button onClick={handleDraft} disabled={drafting}
              style={{ padding: '8px 16px', background: '#fff', color: 'var(--brown)', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
              {drafting ? 'Queuing…' : '✦ Draft outreach'}
            </button>
          </div>

          {research?.research_brief ? (
            <div style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: '#9a7d5a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>What I found</div>
              <p style={{ fontSize: 14, color: 'var(--brown)', lineHeight: 1.75 }}>{research.research_brief}</p>
              {research.research_sources && research.research_sources.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
                  {research.research_sources.map((s, i) => (
                    <span key={i} style={{ fontSize: 10, background: '#f5ede0', color: '#9a7d5a', padding: '2px 8px', borderRadius: 6 }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px dashed #e5d9c9', borderRadius: 12, padding: 24, marginBottom: 24, textAlign: 'center' }}>
              <div style={{ color: '#9a7d5a', fontSize: 14 }}>No research yet — click &ldquo;Research&rdquo; to generate a brief with Claude.</div>
            </div>
          )}

          <div>
            <div style={{ fontSize: 11, color: '#9a7d5a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Timeline</div>
            {[...messages, ...drafts.map(d => ({ id: d.id, direction: 'draft', channel: 'email', subject: d.subject, body: `Draft: ${d.subject ?? 'Outreach'} (${d.status})`, sent_at: d.created_at }))].sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()).map(item => (
              <div key={item.id} style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                  background: item.direction === 'inbound' ? '#B85A35' : item.direction === 'draft' ? '#C9973A' : '#9a7d5a',
                }} />
                <div>
                  <div style={{ fontSize: 13, color: 'var(--brown)', fontWeight: 500 }}>{item.subject ?? item.body.slice(0, 60)}</div>
                  <div style={{ fontSize: 11, color: '#9a7d5a', marginTop: 2 }}>
                    {item.direction === 'inbound' ? 'Replied' : item.direction === 'draft' ? 'Draft' : 'Sent'} ·{' '}
                    {new Date(item.sent_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
            {messages.length === 0 && drafts.length === 0 && (
              <div style={{ color: '#9a7d5a', fontSize: 13 }}>No activity yet.</div>
            )}
          </div>
        </div>

        <div style={{ width: 220, flexShrink: 0 }}>
          <div style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 11, color: '#9a7d5a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Stage</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {STAGES.map(s => (
                <button key={s} onClick={() => handleStageChange(s)} style={{
                  padding: '7px 12px', borderRadius: 8, border: '1px solid',
                  borderColor: lead.stage === s ? 'var(--gold)' : '#e5d9c9',
                  background: lead.stage === s ? 'rgba(201,151,58,0.1)' : 'transparent',
                  color: lead.stage === s ? 'var(--brown)' : '#9a7d5a',
                  fontSize: 12, cursor: 'pointer', textAlign: 'left', textTransform: 'capitalize',
                }}>{s}</button>
              ))}
            </div>

            <div style={{ fontSize: 11, color: '#9a7d5a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Details</div>
            {[
              { label: 'Email', value: lead.email },
              { label: 'LinkedIn', value: lead.linkedin_url ? <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', fontSize: 12 }}>Profile ↗</a> : null },
              { label: 'Est. value', value: lead.est_annual_value ? `$${(lead.est_annual_value / 1000).toFixed(0)}k/yr` : null },
              { label: 'Recurring', value: lead.is_recurring ? 'Yes' : 'No' },
            ].map(({ label, value }) => value ? (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: '#9a7d5a', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, color: 'var(--brown)', wordBreak: 'break-all' }}>{value}</div>
              </div>
            ) : null)}

            {drafts.filter(d => d.status === 'pending' || d.status === 'edited').length > 0 && (
              <Link href="/admin/drafts" style={{ display: 'block', marginTop: 16, padding: '8px 12px', background: 'var(--gold)', color: '#fff', borderRadius: 8, textAlign: 'center', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
                Review draft →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
