'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SiteSettings {
  _id: string
  heroTagline: string
  quote: string
  bioParagraph1: string
  bioParagraph2: string
  supperClubDescription: string
}

const FIELDS: { key: keyof SiteSettings; label: string; multiline?: boolean }[] = [
  { key: 'heroTagline', label: 'Hero tagline', multiline: true },
  { key: 'quote', label: 'Pull quote ("I always do it for the culture.")' },
  { key: 'bioParagraph1', label: 'Bio paragraph 1', multiline: true },
  { key: 'bioParagraph2', label: 'Bio paragraph 2', multiline: true },
  { key: 'supperClubDescription', label: 'Supper club description', multiline: true },
]

export default function SiteSettingsPage() {
  const [doc, setDoc] = useState<SiteSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/content/siteSettings')
      .then(r => r.json())
      .then((docs: SiteSettings[]) => { if (docs[0]) setDoc(docs[0]) })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!doc) return
    setSaving(true)
    const { _id, ...fields } = doc
    await fetch(`/api/admin/content/siteSettings/${_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!doc) return <div style={{ color: '#9a7d5a', padding: 40 }}>Loading…</div>

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 8 }}>
        <Link href="/admin/content" style={{ fontSize: 13, color: '#9a7d5a', textDecoration: 'none' }}>← Content</Link>
      </div>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--brown)', fontWeight: 400, marginBottom: 24 }}>Site Settings</h1>

      <form onSubmit={handleSave}>
        <div style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {FIELDS.map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 12, color: '#9a7d5a', display: 'block', marginBottom: 6 }}>{f.label}</label>
              {f.multiline ? (
                <textarea
                  value={doc[f.key] ?? ''}
                  onChange={e => setDoc(p => p ? { ...p, [f.key]: e.target.value } : p)}
                  rows={3}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, color: 'var(--brown)', lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit' }}
                />
              ) : (
                <input
                  value={doc[f.key] ?? ''}
                  onChange={e => setDoc(p => p ? { ...p, [f.key]: e.target.value } : p)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, color: 'var(--brown)' }}
                />
              )}
            </div>
          ))}
        </div>

        <button type="submit" disabled={saving} style={{
          marginTop: 20, padding: '10px 24px', background: 'var(--gold)', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
