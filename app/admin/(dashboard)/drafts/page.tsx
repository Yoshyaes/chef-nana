'use client'

import { useEffect, useState } from 'react'

interface Draft {
  id: string
  subject: string
  body: string
  reasoning: string
  status: string
  channel: string
  created_at: string
  leads: { name: string; organization: string; fit_score: number | null; market: string }
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [selected, setSelected] = useState<Draft | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [actionLoading, setActionLoading] = useState('')

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

  return (
    <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 64px)', margin: -32 }}>
      <div style={{ width: 300, borderRight: '1px solid #eee5d7', overflowY: 'auto', background: '#faf7f3' }}>
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
              background: selected?.id === d.id ? '#fff' : 'transparent',
              borderLeft: selected?.id === d.id ? '3px solid var(--gold)' : '3px solid transparent',
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

      <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        {!selected ? (
          <div style={{ color: '#9a7d5a', fontSize: 14, marginTop: 60, textAlign: 'center' }}>Select a draft to review</div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#9a7d5a', marginBottom: 2 }}>To</div>
              <div style={{ fontWeight: 500, color: 'var(--brown)' }}>{selected.leads?.name}</div>
              <div style={{ fontSize: 13, color: '#9a7d5a' }}>{selected.leads?.organization} · {selected.leads?.market}</div>
            </div>

            {selected.reasoning && (
              <div style={{ background: '#fffbf4', border: '1px solid #f0e3cc', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 10, color: '#C9973A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Why this draft</div>
                <p style={{ fontSize: 13, color: '#7a6652', lineHeight: 1.6 }}>{selected.reasoning}</p>
              </div>
            )}

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

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
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
          </>
        )}
      </div>
    </div>
  )
}
