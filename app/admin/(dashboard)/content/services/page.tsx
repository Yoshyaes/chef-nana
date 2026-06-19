'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Service { _id: string; title: string; description: string; linkText: string; href: string; order: number }
type Draft = Omit<Service, '_id'>

const EMPTY: Draft = { title: '', description: '', linkText: '', href: '', order: 0 }

const TEXT_FIELDS: Array<{ key: keyof Draft; label: string; multiline?: boolean; req?: boolean }> = [
  { key: 'title', label: 'Title *', req: true },
  { key: 'description', label: 'Description', multiline: true },
  { key: 'linkText', label: 'Link text (e.g. Inquire →)' },
  { key: 'href', label: 'Link href (e.g. #booking)' },
  { key: 'order', label: 'Display order' },
]

export default function ServicesPage() {
  const [docs, setDocs] = useState<Service[]>([])
  const [editing, setEditing] = useState<Service | null>(null)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/content/service').then(r => r.json()).then(setDocs)
  }, [])

  function startEdit(doc: Service) {
    setEditing(doc)
    setDraft({ title: doc.title, description: doc.description, linkText: doc.linkText, href: doc.href, order: doc.order })
    setCreating(false)
  }
  function startCreate() { setCreating(true); setEditing(null); setDraft(EMPTY) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (creating) {
      const res = await fetch('/api/admin/content/service', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
      const created = await res.json()
      setDocs(p => [...p, created])
      setCreating(false)
    } else if (editing) {
      const res = await fetch(`/api/admin/content/service/${editing._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
      const updated = await res.json()
      setDocs(p => p.map(d => d._id === editing._id ? { ...updated, _id: editing._id } : d))
      setEditing(null)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this service?')) return
    await fetch(`/api/admin/content/service/${id}`, { method: 'DELETE' })
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
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--brown)', fontWeight: 400 }}>Services</h1>
        <button onClick={startCreate} style={{ padding: '8px 16px', background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>+ Add service</button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <div style={{ fontWeight: 500, color: 'var(--brown)', marginBottom: 16 }}>{creating ? 'New service' : 'Edit service'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
            {TEXT_FIELDS.map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, color: '#9a7d5a', display: 'block', marginBottom: 4 }}>{f.label}</label>
                {f.multiline ? (
                  <textarea
                    required={!!f.req}
                    value={String(draft[f.key] ?? '')}
                    onChange={e => setDraft(p => ({ ...p, [f.key]: e.target.value }))}
                    rows={3}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5d9c9', borderRadius: 6, fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }}
                  />
                ) : (
                  <input
                    required={!!f.req}
                    value={String(draft[f.key] ?? '')}
                    onChange={e => setDraft(p => ({ ...p, [f.key]: f.key === 'order' ? Number(e.target.value) : e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5d9c9', borderRadius: 6, fontSize: 13 }}
                  />
                )}
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
          <div key={doc._id} style={{ background: '#fff', border: `1px solid ${editing?._id === doc._id ? 'var(--gold)' : '#eee5d7'}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, color: 'var(--brown)', fontSize: 14 }}>{doc.title}</div>
              <div style={{ fontSize: 12, color: '#9a7d5a', marginTop: 4, lineHeight: 1.5 }}>{doc.description}</div>
            </div>
            <button onClick={() => startEdit(doc)} style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', flexShrink: 0 }}>Edit</button>
            <button onClick={() => handleDelete(doc._id)} style={{ fontSize: 12, color: '#B85A35', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', flexShrink: 0 }}>Delete</button>
          </div>
        ))}
        {docs.length === 0 && <div style={{ color: '#9a7d5a', fontSize: 13 }}>No services yet.</div>}
      </div>
    </div>
  )
}
