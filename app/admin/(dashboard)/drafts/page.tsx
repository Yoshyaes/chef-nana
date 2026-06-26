'use client'

import { useEffect, useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

interface Draft {
  id: string
  lead_id: string
  subject: string
  body: string
  reasoning: string
  status: string
  channel: string
  created_at: string
  leads: { name: string; organization: string; fit_score: number | null; market: string }
}

interface Message {
  id: string
  direction: string
  channel: string
  subject: string | null
  body: string
  sent_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function ThreadPanel({ leadId }: { leadId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/messages?leadId=${leadId}`)
      .then(r => r.json())
      .then(setMessages)
      .finally(() => setLoading(false))
  }, [leadId])

  if (loading) return <div style={{ color: '#9a7d5a', fontSize: 12, padding: '8px 0' }}>Loading thread…</div>
  if (messages.length === 0) return null

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, color: '#9a7d5a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        Conversation history ({messages.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map(m => {
          const isInbound = m.direction === 'inbound'
          const isExpanded = expanded[m.id]
          const bodyPreview = m.body.slice(0, 200)
          const hasMore = m.body.length > 200
          return (
            <div key={m.id} style={{
              borderRadius: 10,
              border: `1px solid ${isInbound ? '#e5d9c9' : '#d8e8dc'}`,
              background: isInbound ? '#faf7f3' : '#f4f9f5',
              padding: '12px 16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                    color: isInbound ? '#9a7d5a' : '#2D5F3D',
                    background: isInbound ? '#f0e8db' : '#e0ede4',
                    padding: '2px 7px', borderRadius: 4,
                  }}>
                    {isInbound ? 'THEIR MESSAGE' : 'NANA'}
                  </span>
                  {m.subject && (
                    <span style={{ fontSize: 12, color: 'var(--brown)', fontWeight: 500 }}>{m.subject}</span>
                  )}
                </div>
                <span style={{ fontSize: 11, color: '#b0a090', whiteSpace: 'nowrap', marginLeft: 12 }}>
                  {formatDate(m.sent_at)}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#5c4a38', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {isExpanded ? m.body : bodyPreview}
                {hasMore && !isExpanded && '…'}
              </div>
              {hasMore && (
                <button
                  onClick={() => setExpanded(e => ({ ...e, [m.id]: !e[m.id] }))}
                  style={{ marginTop: 6, fontSize: 11, color: '#9a7d5a', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {isExpanded ? 'Show less' : 'Show full message'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function DraftsPage() {
  const isMobile = useIsMobile()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [selected, setSelected] = useState<Draft | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [actionLoading, setActionLoading] = useState('')
  const [showThread, setShowThread] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list')

  useEffect(() => {
    fetch('/api/admin/drafts').then(r => r.json()).then((d: Draft[]) => {
      setDrafts(d)
      if (d.length > 0 && !selected) setSelected(d[0])
    }).finally(() => setLoading(false))
  }, [])

  function selectDraft(d: Draft) {
    setSelected(d)
    setEditing(false)
    setEditBody(d.body)
    setEditSubject(d.subject)
    setShowThread(false)
    if (isMobile) setMobileView('detail')
  }

  async function handleApprove() {
    if (!selected) return
    setActionLoading('approve')
    const res = await fetch(`/api/admin/drafts/${selected.id}/approve`, { method: 'POST' })
    const result = await res.json()
    if (res.ok) {
      setDrafts(prev => prev.filter(d => d.id !== selected.id))
      setSelected(drafts.find(d => d.id !== selected.id) ?? null)
    } else {
      alert(result.error ?? 'Send failed')
    }
    setActionLoading('')
  }

  async function handleReject() {
    if (!selected) return
    setActionLoading('reject')
    await fetch(`/api/admin/drafts/${selected.id}/reject`, { method: 'POST' })
    setDrafts(prev => prev.filter(d => d.id !== selected.id))
    setSelected(drafts.find(d => d.id !== selected.id) ?? null)
    setActionLoading('')
  }

  async function handleSaveEdit() {
    if (!selected) return
    setActionLoading('save')
    const res = await fetch(`/api/admin/drafts/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: editSubject, body: editBody }),
    })
    const updated = await res.json()
    setDrafts(prev => prev.map(d => d.id === selected.id ? { ...d, ...updated } : d))
    setSelected(prev => prev ? { ...prev, body: editBody, subject: editSubject, status: 'edited' } : null)
    setEditing(false)
    setActionLoading('')
  }

  async function handleRedraft() {
    if (!selected) return
    setActionLoading('redraft')
    await fetch(`/api/admin/drafts/${selected.id}/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 1 }) })
    setActionLoading('')
    alert('New draft queued — refresh in a moment')
  }

  if (loading) return <div style={{ color: '#9a7d5a', padding: 40 }}>Loading drafts…</div>

  const DraftList = (
    <div style={{ background: '#faf7f3', ...(isMobile ? {} : { width: 300, borderRight: '1px solid #eee5d7', overflowY: 'auto', flexShrink: 0 }) }}>
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #eee5d7' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--brown)', fontWeight: 400 }}>
          Drafts ({drafts.length})
        </h2>
      </div>
      {drafts.length === 0 && (
        <div style={{ padding: 24, color: '#9a7d5a', fontSize: 13 }}>No pending drafts.</div>
      )}
      {drafts.map(d => (
        <div
          key={d.id}
          onClick={() => selectDraft(d)}
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid #eee5d7',
            cursor: 'pointer',
            background: selected?.id === d.id && !isMobile ? '#fff' : 'transparent',
            borderLeft: selected?.id === d.id && !isMobile ? '3px solid var(--gold)' : '3px solid transparent',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--brown)', marginBottom: 2 }}>{d.leads?.name}</div>
          <div style={{ fontSize: 11, color: '#9a7d5a', marginBottom: 6 }}>{d.leads?.organization}</div>
          <div style={{ fontSize: 12, color: '#7a6652', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {d.subject}
          </div>
          <div style={{ fontSize: 11, color: '#c5b09a', marginTop: 4 }}>
            {d.channel} · {d.status === 'edited' ? 'edited' : 'pending'}
          </div>
        </div>
      ))}
    </div>
  )

  const DraftDetail = selected ? (
    <div style={{ flex: 1, padding: isMobile ? 16 : 32, overflowY: 'auto' }}>
      {/* Mobile back button */}
      {isMobile && (
        <button
          onClick={() => setMobileView('list')}
          style={{ fontSize: 13, color: 'var(--brown)', background: 'none', border: 'none', padding: '0 0 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          ← All drafts
        </button>
      )}
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: '#9a7d5a', marginBottom: 2 }}>To</div>
          <div style={{ fontWeight: 500, color: 'var(--brown)' }}>{selected.leads?.name}</div>
          <div style={{ fontSize: 13, color: '#9a7d5a' }}>{selected.leads?.organization} · {selected.leads?.market}</div>
        </div>
        {selected.lead_id && (
          <button
            onClick={() => setShowThread(t => !t)}
            style={{
              fontSize: 12, color: showThread ? '#2D5F3D' : '#9a7d5a',
              background: showThread ? '#e8f2ec' : '#f0e8db',
              border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 500,
            }}
          >
            {showThread ? '▾ Hide thread' : '▸ View thread'}
          </button>
        )}
      </div>

      {/* Thread */}
      {showThread && selected.lead_id && <ThreadPanel leadId={selected.lead_id} />}

      {/* Why this draft */}
      {selected.reasoning && (
        <div style={{ background: '#fffbf4', border: '1px solid #f0e3cc', borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: '#C9973A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Why this draft</div>
          <p style={{ fontSize: 13, color: '#7a6652', lineHeight: 1.6 }}>{selected.reasoning}</p>
        </div>
      )}

      {/* Draft body */}
      {editing ? (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: '#9a7d5a', display: 'block', marginBottom: 4 }}>Subject</label>
            <input value={editSubject} onChange={e => setEditSubject(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 14, color: 'var(--brown)' }} />
          </div>
          <textarea
            value={editBody}
            onChange={e => setEditBody(e.target.value)}
            rows={16}
            style={{ width: '100%', padding: '12px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 14, color: 'var(--brown)', lineHeight: 1.7, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#9a7d5a', marginBottom: 4 }}>Subject</div>
            <div style={{ fontWeight: 600, color: 'var(--brown)', fontSize: 15 }}>{selected.subject}</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 10, padding: 20, whiteSpace: 'pre-line', fontSize: 14, color: 'var(--brown)', lineHeight: 1.75 }}>
            {selected.body}
          </div>
        </>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        {!editing ? (
          <>
            <button onClick={handleApprove} disabled={!!actionLoading}
              style={{ padding: '10px 20px', background: '#2D5F3D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {actionLoading === 'approve' ? 'Sending…' : 'Approve & send'}
            </button>
            <button onClick={() => { setEditing(true); setEditBody(selected.body); setEditSubject(selected.subject) }}
              style={{ padding: '10px 18px', background: 'transparent', color: 'var(--brown)', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>
              Edit
            </button>
            <button onClick={handleRedraft} disabled={!!actionLoading}
              style={{ padding: '10px 18px', background: 'transparent', color: '#9a7d5a', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>
              {actionLoading === 'redraft' ? 'Queuing…' : 'Redraft'}
            </button>
            <button onClick={handleReject} disabled={!!actionLoading}
              style={{ padding: '10px 18px', background: 'transparent', color: '#B85A35', border: '1px solid #f0d5cc', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>
              Reject
            </button>
          </>
        ) : (
          <>
            <button onClick={handleSaveEdit} disabled={!!actionLoading}
              style={{ padding: '10px 20px', background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {actionLoading === 'save' ? 'Saving…' : 'Save edits'}
            </button>
            <button onClick={() => setEditing(false)}
              style={{ padding: '10px 18px', background: 'transparent', color: '#9a7d5a', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  ) : (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9a7d5a', fontSize: 14 }}>
      Select a draft to review
    </div>
  )

  if (isMobile) {
    return (
      <div style={{ margin: -16 }}>
        {mobileView === 'list' ? DraftList : DraftDetail}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 64px)', margin: -32 }}>
      {DraftList}
      {DraftDetail}
    </div>
  )
}
