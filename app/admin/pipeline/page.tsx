'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Lead {
  id: string
  name: string
  organization: string
  type: string
  market: string
  fit_score: number | null
  est_annual_value: number | null
  stage: string
  is_recurring: boolean
  updated_at: string
}

const STAGES = [
  { key: 'sourced', label: 'Sourced', color: '#9a7d5a' },
  { key: 'contacted', label: 'Contacted', color: '#C9973A' },
  { key: 'responded', label: 'Responded', color: '#B85A35' },
  { key: 'negotiating', label: 'Negotiating', color: '#8aa86a' },
  { key: 'won', label: 'Trial & Won', color: '#2D5F3D' },
]

function LeadCard({ lead, onStageChange }: { lead: Lead; onStageChange: (id: string, stage: string) => void }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #eee5d7', borderRadius: 10,
      padding: 14, marginBottom: 8, cursor: 'pointer',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}>
      <Link href={`/admin/leads/${lead.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--brown)', marginBottom: 2 }}>{lead.name}</div>
        {lead.organization && <div style={{ fontSize: 12, color: '#9a7d5a', marginBottom: 8 }}>{lead.organization}</div>}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {lead.type && <span style={{ fontSize: 10, background: '#f5ede0', color: '#7a6652', padding: '2px 7px', borderRadius: 5 }}>{lead.type}</span>}
          {lead.market && <span style={{ fontSize: 10, background: '#f5ede0', color: '#7a6652', padding: '2px 7px', borderRadius: 5 }}>{lead.market}</span>}
          {lead.is_recurring && <span style={{ fontSize: 10, background: '#e8f0ea', color: '#2D5F3D', padding: '2px 7px', borderRadius: 5 }}>Recurring</span>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {lead.fit_score != null && (
            <span style={{ fontSize: 12, color: lead.fit_score >= 80 ? '#2D5F3D' : '#C9973A', fontWeight: 600 }}>
              {lead.fit_score} fit
            </span>
          )}
          {lead.est_annual_value && (
            <span style={{ fontSize: 11, color: '#9a7d5a' }}>
              ~${(lead.est_annual_value / 1000).toFixed(0)}k/yr
            </span>
          )}
        </div>
      </Link>
      <select
        value={lead.stage}
        onChange={e => onStageChange(lead.id, e.target.value)}
        onClick={e => e.stopPropagation()}
        style={{
          marginTop: 10, width: '100%', fontSize: 11, padding: '4px 6px',
          border: '1px solid #e5d9c9', borderRadius: 6, color: '#7a6652',
          background: '#faf7f3', cursor: 'pointer',
        }}
      >
        {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
      </select>
    </div>
  )
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLead, setNewLead] = useState({ name: '', organization: '', email: '', type: '', market: '' })

  useEffect(() => {
    fetch('/api/admin/leads').then(r => r.json()).then(setLeads).finally(() => setLoading(false))
  }, [])

  async function handleStageChange(id: string, stage: string) {
    await fetch(`/api/admin/leads/${id}/stage`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage }) })
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l))
  }

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newLead) })
    const lead = await res.json()
    setLeads(prev => [...prev, lead])
    setNewLead({ name: '', organization: '', email: '', type: '', market: '' })
    setShowAddForm(false)
  }

  const filtered = leads.filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()) || (l.organization ?? '').toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div style={{ color: '#9a7d5a', padding: 40 }}>Loading pipeline…</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--brown)', fontWeight: 400 }}>Pipeline</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            placeholder="Search leads…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, color: 'var(--brown)', background: '#fff', width: 180 }}
          />
          <button
            onClick={() => setShowAddForm(true)}
            style={{ padding: '8px 16px', background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
          >
            + Add lead
          </button>
        </div>
      </div>

      {showAddForm && (
        <div style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ fontWeight: 500, marginBottom: 16, color: 'var(--brown)' }}>New lead</div>
          <form onSubmit={handleAddLead}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {[
                { label: 'Name *', key: 'name', required: true },
                { label: 'Organization', key: 'organization', required: false },
                { label: 'Email', key: 'email', required: false },
                { label: 'Market (nyc / philly / hamptons / accra)', key: 'market', required: false },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, color: '#9a7d5a', display: 'block', marginBottom: 4 }}>{f.label}</label>
                  <input
                    required={f.required}
                    value={newLead[f.key as keyof typeof newLead]}
                    onChange={e => setNewLead(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5d9c9', borderRadius: 6, fontSize: 13 }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" style={{ padding: '8px 16px', background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Add</button>
              <button type="button" onClick={() => setShowAddForm(false)} style={{ padding: '8px 16px', background: 'transparent', color: '#9a7d5a', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, alignItems: 'start' }}>
        {STAGES.map(stage => {
          const col = filtered.filter(l => l.stage === stage.key)
          return (
            <div key={stage.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown)' }}>{stage.label}</span>
                <span style={{ fontSize: 11, color: '#9a7d5a', marginLeft: 'auto' }}>{col.length}</span>
              </div>
              <div>
                {col.map(lead => <LeadCard key={lead.id} lead={lead} onStageChange={handleStageChange} />)}
                {col.length === 0 && <div style={{ fontSize: 12, color: '#c5b09a', padding: '12px 0', textAlign: 'center' }}>—</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
