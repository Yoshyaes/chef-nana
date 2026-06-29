'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import MenuEditor, { MenuFormData } from '@/components/admin/MenuEditor'

interface Asset { path: string; type: string; uploadedAt: string; signedUrl?: string | null }
interface Dish { name: string; description: string; dietary: string[]; allergens: string[] }
interface Course { name: string; dishes: Dish[] }

interface Menu {
  id: string
  title: string
  occasion: string[]
  cuisine: string[]
  season: string | null
  guest_min: number | null
  guest_max: number | null
  courses: Course[]
  source_photos: Asset[]
  status: 'draft' | 'active' | 'archived'
  price_per_guest: number | null
  last_used_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

const STATUS_STYLE: Record<string, { background: string; color: string }> = {
  draft: { background: '#fdf4e7', color: '#C9973A' },
  active: { background: '#e8f0ea', color: '#2D5F3D' },
  archived: { background: '#f0ece6', color: '#9a7d5a' },
}

function occasionLabel(v: string) {
  return v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function guestRange(min: number | null, max: number | null) {
  if (!min && !max) return null
  if (min && max) return `${min}${min !== max ? `-${max}` : ''} guests`
  if (min) return `${min}+ guests`
  return `Up to ${max} guests`
}

function menuToForm(menu: Menu): MenuFormData {
  return {
    title: menu.title,
    occasion: menu.occasion,
    cuisine: menu.cuisine,
    season: menu.season ?? '',
    guest_min: menu.guest_min != null ? String(menu.guest_min) : '',
    guest_max: menu.guest_max != null ? String(menu.guest_max) : '',
    notes: menu.notes ?? '',
    courses: menu.courses,
    source_photos: menu.source_photos,
    status: menu.status,
  }
}

export default function MenuDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [menu, setMenu] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/menus/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setMenu(d) })
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave(form: MenuFormData) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/menus/${id}`, {
        method: 'PATCH',
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
        setError(data.error ?? 'Save failed')
        return
      }
      const updated = await res.json()
      setMenu(prev => prev ? { ...prev, ...updated, source_photos: form.source_photos } : null)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDuplicate() {
    setDuplicating(true)
    try {
      const res = await fetch(`/api/admin/menus/${id}/duplicate`, { method: 'POST' })
      if (res.ok) {
        const newMenu = await res.json()
        router.push(`/admin/menus/${newMenu.id}`)
      }
    } finally {
      setDuplicating(false)
    }
  }

  async function handleArchive() {
    if (!confirm('Archive this menu? It will be hidden from the main list but still searchable.')) return
    setArchiving(true)
    try {
      const res = await fetch(`/api/admin/menus/${id}/archive`, { method: 'POST' })
      if (res.ok) router.push('/admin/menus')
    } finally {
      setArchiving(false)
    }
  }

  if (loading) return <div style={{ color: '#9a7d5a', padding: 40 }}>Loading...</div>
  if (!menu) return <div style={{ color: '#B85A35', padding: 40 }}>Menu not found.</div>

  const badge = STATUS_STYLE[menu.status] ?? STATUS_STYLE.draft
  const range = guestRange(menu.guest_min, menu.guest_max)

  if (editing) {
    return (
      <div>
        <div style={{ marginBottom: 12 }}>
          <button
            onClick={() => setEditing(false)}
            style={{ fontSize: 13, color: '#9a7d5a', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Cancel editing
          </button>
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--brown)', fontWeight: 400, marginBottom: 28 }}>
          Edit menu
        </h1>
        {error && (
          <div style={{ padding: '10px 14px', background: '#fdf0ec', border: '1px solid #f0cfc4', borderRadius: 8, color: '#B85A35', fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}
        <div style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 16, padding: '32px', maxWidth: 760 }}>
          <MenuEditor
            initialData={menuToForm(menu)}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            saving={saving}
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Back link */}
      <div style={{ marginBottom: 12 }}>
        <Link href="/admin/menus" style={{ fontSize: 13, color: '#9a7d5a', textDecoration: 'none' }}>
          Back to Menus
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--brown)', fontWeight: 400 }}>
              {menu.title}
            </h1>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, fontWeight: 600, ...badge }}>
              {menu.status}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {menu.occasion.map(o => (
              <span key={o} style={{ fontSize: 11, background: '#f5ede0', color: '#7a6652', padding: '3px 8px', borderRadius: 6 }}>
                {occasionLabel(o)}
              </span>
            ))}
            {menu.cuisine.map(c => (
              <span key={c} style={{ fontSize: 11, background: '#f0ece6', color: '#9a7d5a', padding: '3px 8px', borderRadius: 6 }}>
                {c}
              </span>
            ))}
            {range && (
              <span style={{ fontSize: 11, color: '#9a7d5a', padding: '3px 8px' }}>{range}</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setEditing(true)}
            style={{ padding: '8px 18px', background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            Edit
          </button>
          <button
            onClick={handleDuplicate}
            disabled={duplicating}
            style={{ padding: '8px 14px', background: '#fff', color: 'var(--brown)', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
          >
            {duplicating ? 'Copying...' : 'Duplicate'}
          </button>
          {menu.status !== 'archived' && (
            <button
              onClick={handleArchive}
              disabled={archiving}
              style={{ padding: '8px 14px', background: '#fff', color: '#9a7d5a', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
            >
              {archiving ? 'Archiving...' : 'Archive'}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Main content */}
        <div style={{ flex: 1, minWidth: 300 }}>

          {/* Courses */}
          {menu.courses.length > 0 ? (
            <div style={{ marginBottom: 32 }}>
              {menu.courses.map((course, ci) => (
                <div key={ci} style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, color: '#9a7d5a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                    {course.name || `Course ${ci + 1}`}
                  </div>
                  {course.dishes.map((dish, di) => (
                    <div key={di} style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 10, padding: '14px 16px', marginBottom: 8 }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--brown)', marginBottom: dish.description ? 4 : 0 }}>
                        {dish.name}
                      </div>
                      {dish.description && (
                        <div style={{ fontSize: 13, color: '#7a6652', marginBottom: 8, lineHeight: 1.5 }}>
                          {dish.description}
                        </div>
                      )}
                      {(dish.dietary.length > 0 || dish.allergens.length > 0) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {dish.dietary.map(d => (
                            <span key={d} style={{ fontSize: 10, background: '#e8f0ea', color: '#2D5F3D', padding: '2px 6px', borderRadius: 4 }}>
                              {d}
                            </span>
                          ))}
                          {dish.allergens.map(a => (
                            <span key={a} style={{ fontSize: 10, background: '#fdf0ec', color: '#B85A35', padding: '2px 6px', borderRadius: 4 }}>
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: '#faf7f3', border: '1px dashed #e5d9c9', borderRadius: 10, padding: '28px', textAlign: 'center', color: '#9a7d5a', fontSize: 13, marginBottom: 32 }}>
              No courses added yet. Click Edit to add dishes.
            </div>
          )}

          {/* Source photos */}
          {menu.source_photos.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: '#9a7d5a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Source photos
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {menu.source_photos.map((photo, i) => (
                  photo.type.startsWith('image/') && photo.signedUrl ? (
                    <img
                      key={i}
                      src={photo.signedUrl}
                      alt={`Menu photo ${i + 1}`}
                      style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 10, border: '1px solid #e5d9c9' }}
                    />
                  ) : (
                    <div key={i} style={{
                      width: 120, height: 120, borderRadius: 10, border: '1px solid #e5d9c9',
                      background: '#f5ede0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      fontSize: 28, color: '#9a7d5a',
                    }}>
                      <div>📄</div>
                      <div style={{ fontSize: 10, marginTop: 4 }}>PDF</div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar metadata */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 11, color: '#9a7d5a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Details
            </div>
            {[
              { label: 'Season', value: menu.season ? menu.season.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : null },
              { label: 'Guest range', value: range },
              { label: 'Last used', value: menu.last_used_at ? new Date(menu.last_used_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : null },
              { label: 'Created', value: new Date(menu.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) },
            ].map(({ label, value }) => value ? (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: '#9a7d5a', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, color: 'var(--brown)' }}>{value}</div>
              </div>
            ) : null)}

            {menu.notes && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee5d7' }}>
                <div style={{ fontSize: 10, color: '#9a7d5a', marginBottom: 6 }}>Notes</div>
                <div style={{ fontSize: 13, color: '#7a6652', lineHeight: 1.5 }}>{menu.notes}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
