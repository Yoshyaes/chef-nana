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

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/leads').then(r => r.json()).then(setLeads).finally(() => setLoading(false))
  }, [])

  const filtered = leads.filter(l =>
    !search ||
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.organization ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div style={{ color: '#9a7d5a', padding: 40 }}>Loading leads…</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--brown)', fontWeight: 400 }}>
          All Leads ({leads.length})
        </h1>
        <input
          placeholder="Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, color: 'var(--brown)', background: '#fff', width: 200 }}
        />
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
              <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#9a7d5a' }}>No leads yet. Add them from the Pipeline view or via Apollo search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
