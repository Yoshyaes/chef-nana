'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'

interface TicketEvent {
  id: string
  slug: string
  title: string
  description: string | null
  event_date: string
  location: string | null
  price_cents: number
  capacity: number
  status: 'draft' | 'published' | 'sold_out' | 'closed'
}

interface Attendee {
  id: string
  name: string
  email: string
  quantity: number
  checked_in: boolean
  checked_in_at: string | null
  refunded: boolean
  created_at: string
}

export default function TicketingEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [event, setEvent] = useState<TicketEvent | null>(null)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await fetch(`/api/admin/ticketing/events/${id}`)
    if (!res.ok) return
    const body = await res.json()
    setEvent(body.event)
    setAttendees(body.attendees)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!event) return
    setSaving(true)
    await fetch(`/api/admin/ticketing/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
    setSaving(false)
  }

  async function toggleCheckedIn(attendee: Attendee) {
    const res = await fetch(`/api/admin/ticketing/attendees/${attendee.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked_in: !attendee.checked_in }),
    })
    if (res.ok) {
      const updated = await res.json()
      setAttendees(p => p.map(a => (a.id === updated.id ? updated : a)))
    }
  }

  if (!event) return <div style={{ color: '#9a7d5a', fontSize: 13 }}>Loading…</div>

  const seatsSold = attendees.filter(a => !a.refunded).reduce((sum, a) => sum + a.quantity, 0)

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 8 }}>
        <Link href="/admin/ticketing" style={{ fontSize: 13, color: '#9a7d5a', textDecoration: 'none' }}>
          ← Ticketing
        </Link>
      </div>

      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--brown)', fontWeight: 400, marginBottom: 4 }}>
        {event.title}
      </h1>
      <p style={{ fontSize: 13, color: '#9a7d5a', marginBottom: 24 }}>
        {seatsSold} of {event.capacity} seats sold · /events/{event.slug}
      </p>

      <form onSubmit={handleSave} style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <TextField label="Title" value={event.title} onChange={v => setEvent({ ...event, title: v })} span2 />
          <TextField label="Slug" value={event.slug} onChange={v => setEvent({ ...event, slug: v })} />
          <TextField label="Location" value={event.location ?? ''} onChange={v => setEvent({ ...event, location: v })} />
          <div>
            <label style={{ fontSize: 11, color: '#9a7d5a', display: 'block', marginBottom: 4 }}>Capacity</label>
            <input
              type="number"
              value={event.capacity}
              onChange={e => setEvent({ ...event, capacity: Number(e.target.value) })}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5d9c9', borderRadius: 6, fontSize: 13 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#9a7d5a', display: 'block', marginBottom: 4 }}>Price (USD)</label>
            <input
              type="number"
              value={event.price_cents / 100}
              onChange={e => setEvent({ ...event, price_cents: Math.round(Number(e.target.value) * 100) })}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5d9c9', borderRadius: 6, fontSize: 13 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#9a7d5a', display: 'block', marginBottom: 4 }}>Status</label>
            <select
              value={event.status}
              onChange={e => setEvent({ ...event, status: e.target.value as TicketEvent['status'] })}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5d9c9', borderRadius: 6, fontSize: 13 }}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="sold_out">Sold out</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: 11, color: '#9a7d5a', display: 'block', marginBottom: 4 }}>Description</label>
            <textarea
              value={event.description ?? ''}
              onChange={e => setEvent({ ...event, description: e.target.value })}
              rows={3}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5d9c9', borderRadius: 6, fontSize: 13 }}
            />
          </div>
        </div>
        <button type="submit" disabled={saving} style={{ padding: '8px 16px', background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>

      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--brown)', fontWeight: 400, marginBottom: 12 }}>
        Attendees ({attendees.length})
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {attendees.map(a => (
          <div key={a.id} style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--brown)', fontWeight: 500 }}>
                {a.name} {a.refunded && <span style={{ color: '#B85A35' }}>· refunded</span>}
              </div>
              <div style={{ fontSize: 12, color: '#9a7d5a' }}>{a.email} · qty {a.quantity}</div>
            </div>
            {!a.refunded && (
              <button
                onClick={() => toggleCheckedIn(a)}
                style={{
                  fontSize: 12,
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid #e5d9c9',
                  background: a.checked_in ? '#2D5F3D' : 'transparent',
                  color: a.checked_in ? '#fff' : '#9a7d5a',
                  cursor: 'pointer',
                }}
              >
                {a.checked_in ? 'Checked in' : 'Mark arrived'}
              </button>
            )}
          </div>
        ))}
        {attendees.length === 0 && <div style={{ color: '#9a7d5a', fontSize: 13 }}>No attendees yet.</div>}
      </div>
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  span2 = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  span2?: boolean
}) {
  return (
    <div style={{ gridColumn: span2 ? 'span 2' : undefined }}>
      <label style={{ fontSize: 11, color: '#9a7d5a', display: 'block', marginBottom: 4 }}>{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5d9c9', borderRadius: 6, fontSize: 13 }}
      />
    </div>
  )
}
