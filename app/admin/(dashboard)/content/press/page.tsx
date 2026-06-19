'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface PressItem { _id: string; name: string; href: string; order: number }
type Draft = Omit<PressItem, '_id'>

const EMPTY: Draft = { name: '', href: '', order: 0 }

const FIELDS: Array<{ key: keyof Draft; label: string; req?: boolean }> = [
  { key: 'name', label: 'Publication name *', req: true },
  { key: 'href', label: 'Article URL *', req: true },
  { key: 'order', label: 'Display order' },
]

export default function PressPage() {
  const [docs, setDocs] = useState<PressItem[]>([])
  const [editing, setEditing] = useState<PressItem | null>(null)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/content/pressItem').then(r => r.json()).then(setDocs)
  }, [])

  function startEdit(doc: PressItem) { setEditing(doc); setDraft({ name: doc.name, href: doc.href, order: doc.order }); setCreating(false) }
  function startCreate() { setCreating(true); setEditing(null); setDraft(EMPTY) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (creating) {
      const res = await fetch('/api/admin/content/pressItem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
      const created = await res.json()
      setDocs(p => [...p, created])
      setCreating(false)
    } else if (editing) {
      const res = await fetch(`/api/admin/content/pressItem/${editing._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
      const updated = await res.json()
      setDocs(p => p.map(d => d._id === editing._id ? { ...updated, _id: editing._id } : d))
      setEditing(null)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this press item?')) return
    await fetch(`/api/admin/content/pressItem/${id}`, { method: 'DELETE' })
    setDocs(p => p.filter(d => d._id !== id))
    if (editing?._id === id) setEditing(null)
  }

  const showForm = creating || editing

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 8 }}>
        <Link href="/admin/content" style={{ fontSize: 13, color: '#9a7d5a', textDecoration: 'none' }}>← Content</Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--brown)', fontWeight: 400 }}>Press</h1>
        <button onClick={startCreate} style={{ padding: '8px 16px', background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>+ Add</button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <div style={{ fontWeight: 500, color: 'var(--brown)', marginBottom: 16 }}>{creating ? 'New press item' : 'Edit press item'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
            {FIELDS.map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, color: '#9a7d5a', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input
                  required={!!f.req}
                  value={String(draft[f.key] ?? '')}
                  onChange={e => setDraft(p => ({ ...p, [f.key]: f.key === 'order' ? Number(e.target.value) : e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5d9c9', borderRadius: 6, fontSize: 13 }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={saving} style={{ padding: '8px 16px', background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" onClick={() => { setCreating(false); setEditing(null) }} style={{ padding: '8px 14px', background: 'transparent', color: '#9a7d5a', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {docs.map(doc => (
          <div key={doc._id} style={{ background: '#fff', border: `1px solid ${editing?._id === doc._id ? 'var(--gold)' : '#eee5d7'}`, borderRadius: 10, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, color: 'var(--brown)', fontSize: 14 }}>{doc.name}</div>
              <div style={{ fontSize: 11, color: '#9a7d5a', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.href}</div>
            </div>
            <a href={doc.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#9a7d5a', textDecoration: 'none' }}>↗</a>
            <button onClick={() => startEdit(doc)} style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>Edit</button>
            <button onClick={() => handleDelete(doc._id)} style={{ fontSize: 12, color: '#B85A35', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>Delete</button>
          </div>
        ))}
        {docs.length === 0 && <div style={{ color: '#9a7d5a', fontSize: 13 }}>No press items yet.</div>}
      </div>
    </div>
  )
}
