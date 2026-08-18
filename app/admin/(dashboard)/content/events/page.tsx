'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Event { _id: string; title: string; date: string; location: string; price: string; ticketUrl: string; detail: string; order: number }
type Draft = Omit<Event, '_id'>

const EMPTY: Draft = { title: '', date: '', location: '', price: '', ticketUrl: '', detail: '', order: 0 }

export default function EventsPage() {
  const [docs, setDocs] = useState<Event[]>([])
  const [editing, setEditing] = useState<Event | null>(null)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/content/event').then(r => r.json()).then(setDocs)
  }, [])

  function startEdit(doc: Event) {
    setEditing(doc)
    setDraft({ title: doc.title, date: doc.date, location: doc.location, price: doc.price, ticketUrl: doc.ticketUrl ?? '', detail: doc.detail ?? '', order: doc.order })
    setCreating(false)
  }
  function startCreate() { setCreating(true); setEditing(null); setDraft(EMPTY) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (creating) {
      const res = await fetch('/api/admin/content/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
      const created = await res.json()
      setDocs(p => [...p, created])
      setCreating(false)
    } else if (editing) {
      const res = await fetch(`/api/admin/content/event/${editing._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
      const updated = await res.json()
      setDocs(p => p.map(d => d._id === editing._id ? { ...updated, _id: editing._id } : d))
      setEditing(null)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this event?')) return
    await fetch(`/api/admin/content/event/${id}`, { method: 'DELETE' })
    setDocs(p => p.filter(d => d._id !== id))
    if (editing?._id === id) setEditing(null)
  }

  const showForm = creating || editing

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 8 }}>
        <Link href="/admin/content" style={{ fontSize: 13, color: '#9a7d5a', textDecoration: 'none' }}>← Content</Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--brown)', fontWeight: 400 }}>Events</h1>
        <button onClick={startCreate} style={{ padding: '8px 16px', background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>+ Add event</button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <div style={{ fontWeight: 500, color: 'var(--brown)', marginBottom: 16 }}>{creating ? 'New event' : 'Edit event'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            {([['title', 'Title *', true], ['date', 'Date (e.g. Apr 11 + 12)'], ['location', 'Location'], ['price', 'Price (e.g. $180)'], ['ticketUrl', 'Get Tickets link (external URL or /events/slug)'], ['order', 'Display order']] as [keyof Draft, string, boolean?][]).map(([key, label, req]) => (
              <div key={key} style={{ gridColumn: key === 'title' || key === 'ticketUrl' ? 'span 2' : undefined }}>
                <label style={{ fontSize: 11, color: '#9a7d5a', display: 'block', marginBottom: 4 }}>{label}</label>
                <input
                  required={!!req}
                  value={String(draft[key] ?? '')}
                  onChange={e => setDraft(p => ({ ...p, [key]: key === 'order' ? Number(e.target.value) : e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5d9c9', borderRadius: 6, fontSize: 13 }}
                />
              </div>
            ))}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 11, color: '#9a7d5a', display: 'block', marginBottom: 4 }}>Expanded detail (address/time shown when a guest expands the row)</label>
              <textarea
                value={draft.detail}
                onChange={e => setDraft(p => ({ ...p, detail: e.target.value }))}
                rows={2}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5d9c9', borderRadius: 6, fontSize: 13 }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={saving} style={{ padding: '8px 16px', background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => { setCreating(false); setEditing(null) }} style={{ padding: '8px 14px', background: 'transparent', color: '#9a7d5a', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {docs.map(doc => (
          <div key={doc._id} style={{ background: '#fff', border: `1px solid ${editing?._id === doc._id ? 'var(--gold)' : '#eee5d7'}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, color: 'var(--brown)', fontSize: 14 }}>{doc.title}</div>
              <div style={{ fontSize: 12, color: '#9a7d5a', marginTop: 2 }}>{doc.date} · {doc.location}{doc.price ? ` · ${doc.price}` : ''}</div>
            </div>
            <button onClick={() => startEdit(doc)} style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>Edit</button>
            <button onClick={() => handleDelete(doc._id)} style={{ fontSize: 12, color: '#B85A35', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>Delete</button>
          </div>
        ))}
        {docs.length === 0 && <div style={{ color: '#9a7d5a', fontSize: 13 }}>No events yet.</div>}
      </div>
    </div>
  )
}
