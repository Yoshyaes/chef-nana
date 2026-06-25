'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Lead {
  id: string; name: string; organization: string; type: string
  market: string; fit_score: number | null; est_annual_value: number | null
  stage: string; is_recurring: boolean; email: string | null; source: string
}

const STAGE_COLORS: Record<string, string> = {
  sourced: '#9a7d5a', contacted: '#C9973A', responded: '#B85A35',
  negotiating: '#8aa86a', won: '#2D5F3D', lost: '#ccc', nurture: '#b0c4d8',
}

const MARKETS = ['Corporate events', 'Private dining', 'Weddings', 'Meal prep', 'Retreats', 'Other']

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', organization: '', email: '', market: '', type: 'one-off' })

  useEffect(() => {
    fetch('/api/admin/leads').then(r => r.json()).then(setLeads).finally(() => setLoading(false))
  }, [])

  const filtered = leads.filter(l =>
    !search ||
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.organization ?? '').toLowerCase().includes(search.toLowerCase())
  )

  async function addLead(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const res = await fetch('/api/admin/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, source: 'manual' }),
    })
    if (res.ok) {
      const newLead = await res.json()
      setLeads(prev => [newLead, ...prev])
      setForm({ name: '', organization: '', email: '', market: '', type: 'one-off' })
      setShowModal(false)
    }
    setSaving(false)
  }

  if (loading) return <div style={{ color: '#9a7d5a', padding: 40 }}>Loading leads…</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--brown)', fontWeight: 400 }}>
          All Leads ({leads.length})
        </h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, color: 'var(--brown)', background: '#fff', width: 200 }}
          />
          <button
            onClick={() => setShowModal(true)}
            style={{ padding: '8px 16px', background: 'var(--brown)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
          >
            + Add lead
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #eee5d7', background: '#faf7f3' }}>
              {['Name', 'Organization', 'Market', 'Stage', 'Fit', 'Value/yr', 'Source'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, fontSize: 11, color: '#9a7d5a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(lead => (
              <tr key={lead.id} style={{ borderBottom: '1px solid #f5ede0' }}>
                <td style={{ padding: '12px 16px' }}>
                  <Link href={`/admin/leads/${lead.id}`} style={{ color: 'var(--brown)', fontWeight: 500, textDecoration: 'none' }}>
                    {lead.name}
                  </Link>
                  {lead.is_recurring && <span style={{ fontSize: 10, background: '#e8f0ea', color: '#2D5F3D', padding: '1px 5px', borderRadius: 4, marginLeft: 6 }}>Recurring</span>}
                </td>
                <td style={{ padding: '12px 16px', color: '#7a6652' }}>{lead.organization ?? '—'}</td>
                <td style={{ padding: '12px 16px', color: '#7a6652' }}>{lead.market ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 6,
                    background: `${STAGE_COLORS[lead.stage] ?? '#ccc'}22`,
                    color: STAGE_COLORS[lead.stage] ?? '#ccc', fontWeight: 500,
                  }}>{lead.stage}</span>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: lead.fit_score != null && lead.fit_score >= 80 ? '#2D5F3D' : '#C9973A' }}>
                  {lead.fit_score != null ? `${lead.fit_score}` : '—'}
                </td>
                <td style={{ padding: '12px 16px', color: '#7a6652' }}>
                  {lead.est_annual_value ? `$${(lead.est_annual_value / 1000).toFixed(0)}k` : '—'}
                </td>
                <td style={{ padding: '12px 16px', color: '#9a7d5a', fontSize: 11 }}>{lead.source ?? '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#9a7d5a' }}>
                No leads yet. Click &ldquo;+ Add lead&rdquo; to create one, or use Apollo search in Settings.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 440, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--brown)', fontWeight: 400, marginBottom: 20 }}>Add a lead</h2>
            <form onSubmit={addLead} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: '#9a7d5a', display: 'block', marginBottom: 4 }}>Name *</label>
                <input
                  required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Jane Smith"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#9a7d5a', display: 'block', marginBottom: 4 }}>Organization</label>
                <input
                  value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                  placeholder="Acme Corp"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#9a7d5a', display: 'block', marginBottom: 4 }}>Email</label>
                <input
                  type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="jane@example.com"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: '#9a7d5a', display: 'block', marginBottom: 4 }}>Market</label>
                  <select
                    value={form.market} onChange={e => setForm(f => ({ ...f, market: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, background: '#fff' }}
                  >
                    <option value="">Select…</option>
                    {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: '#9a7d5a', display: 'block', marginBottom: 4 }}>Type</label>
                  <select
                    value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, background: '#fff' }}
                  >
                    <option value="one-off">One-off</option>
                    <option value="recurring">Recurring</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '10px', border: '1px solid #e5d9c9', borderRadius: 8, background: '#fff', color: '#9a7d5a', fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: 'var(--brown)', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                  {saving ? 'Adding…' : 'Add lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
