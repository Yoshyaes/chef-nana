'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface TicketEvent {
  id: string
  slug: string
  title: string
  event_date: string
  location: string | null
  price_cents: number
  capacity: number
  status: 'draft' | 'published' | 'sold_out' | 'closed'
  seats_sold: number
}

type Draft = {
  slug: string
  title: string
  description: string
  event_date: string
  location: string
  price_cents: number
  capacity: number
  status: TicketEvent['status']
}

const EMPTY: Draft = {
  slug: '',
  title: '',
  description: '',
  event_date: '',
  location: '',
  price_cents: 0,
  capacity: 20,
  status: 'draft',
}

export default function TicketingPage() {
  const [events, setEvents] = useState<TicketEvent[]>([])
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/ticketing/events')
      .then(r => r.json())
      .then(setEvents)
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/ticketing/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...draft,
        price_cents: Math.round(Number(draft.price_cents)),
        capacity: Number(draft.capacity),
        event_date: draft.event_date ? new Date(draft.event_date).toISOString() : null,
      }),
    })
    if (res.ok) {
      const created = await res.json()
      setEvents(p => [...p, { ...created, seats_sold: 0 }])
      setCreating(false)
      setDraft(EMPTY)
    }
    setSaving(false)
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--brown)', fontWeight: 400 }}>
          Ticketing
        </h1>
        <button
          onClick={() => setCreating(c => !c)}
          style={{ padding: '8px 16px', background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
        >
          + New event
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Field label="Title *" value={draft.title} onChange={v => setDraft(p => ({ ...p, title: v }))} span2 />
            <Field label="Slug * (/events/…)" value={draft.slug} onChange={v => setDraft(p => ({ ...p, slug: v }))} />
            <Field label="Location" value={draft.location} onChange={v => setDraft(p => ({ ...p, location: v }))} />
            <Field
              label="Date & time *"
              type="datetime-local"
              value={draft.event_date}
              onChange={v => setDraft(p => ({ ...p, event_date: v }))}
            />
            <Field label="Capacity *" type="number" value={String(draft.capacity)} onChange={v => setDraft(p => ({ ...p, capacity: Number(v) }))} />
            <Field
              label="Price (USD) *"
              type="number"
              value={String(draft.price_cents / 100)}
              onChange={v => setDraft(p => ({ ...p, price_cents: Math.round(Number(v) * 100) }))}
            />
            <div>
              <label style={{ fontSize: 11, color: '#9a7d5a', display: 'block', marginBottom: 4 }}>Status</label>
              <select
                value={draft.status}
                onChange={e => setDraft(p => ({ ...p, status: e.target.value as TicketEvent['status'] }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5d9c9', borderRadius: 6, fontSize: 13 }}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 11, color: '#9a7d5a', display: 'block', marginBottom: 4 }}>Description</label>
              <textarea
                value={draft.description}
                onChange={e => setDraft(p => ({ ...p, description: e.target.value }))}
                rows={3}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5d9c9', borderRadius: 6, fontSize: 13 }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={saving} style={{ padding: '8px 16px', background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
              {saving ? 'Saving…' : 'Create'}
            </button>
            <button type="button" onClick={() => setCreating(false)} style={{ padding: '8px 14px', background: 'transparent', color: '#9a7d5a', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {events.map(ev => (
          <Link key={ev.id} href={`/admin/ticketing/${ev.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, color: 'var(--brown)', fontSize: 14 }}>{ev.title}</div>
                <div style={{ fontSize: 12, color: '#9a7d5a', marginTop: 2 }}>
                  {new Date(ev.event_date).toLocaleDateString()} · {ev.location} · {ev.seats_sold}/{ev.capacity} seats
                </div>
              </div>
              <StatusBadge status={ev.status} />
            </div>
          </Link>
        ))}
        {events.length === 0 && <div style={{ color: '#9a7d5a', fontSize: 13 }}>No events yet.</div>}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: TicketEvent['status'] }) {
  const colors: Record<TicketEvent['status'], string> = {
    draft: '#9a7d5a',
    published: '#2D5F3D',
    sold_out: '#B85A35',
    closed: '#666',
  }
  return (
    <span style={{ fontSize: 11, color: '#fff', background: colors[status], borderRadius: 6, padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {status.replace('_', ' ')}
    </span>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  span2 = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  span2?: boolean
}) {
  return (
    <div style={{ gridColumn: span2 ? 'span 2' : undefined }}>
      <label style={{ fontSize: 11, color: '#9a7d5a', display: 'block', marginBottom: 4 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5d9c9', borderRadius: 6, fontSize: 13 }}
      />
    </div>
  )
}
