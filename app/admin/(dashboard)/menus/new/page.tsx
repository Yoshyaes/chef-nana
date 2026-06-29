'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import MenuEditor, { MenuFormData } from '@/components/admin/MenuEditor'

export default function NewMenuPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(form: MenuFormData) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          occasion: form.occasion,
          cuisine: form.cuisine,
          season: form.season || null,
          guest_min: form.guest_min ? parseInt(form.guest_min, 10) : null,
          guest_max: form.guest_max ? parseInt(form.guest_max, 10) : null,
          courses: form.courses,
          source_photos: form.source_photos.map(({ signedUrl: _, ...rest }) => rest),
          status: form.status,
          notes: form.notes || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to save menu')
        return
      }
      const menu = await res.json()
      router.push(`/admin/menus/${menu.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Link href="/admin/menus" style={{ fontSize: 13, color: '#9a7d5a', textDecoration: 'none' }}>
          Back to Menus
        </Link>
      </div>

      <h1 style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 26,
        color: 'var(--brown)',
        fontWeight: 400,
        marginBottom: 28,
      }}>
        New menu
      </h1>

      {error && (
        <div style={{
          padding: '10px 14px',
          background: '#fdf0ec',
          border: '1px solid #f0cfc4',
          borderRadius: 8,
          color: '#B85A35',
          fontSize: 13,
          marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      <div style={{
        background: '#fff',
        border: '1px solid #eee5d7',
        borderRadius: 16,
        padding: '32px',
        maxWidth: 760,
      }}>
        <MenuEditor
          onSave={handleSave}
          onCancel={() => router.push('/admin/menus')}
          saving={saving}
        />
      </div>
    </div>
  )
}
