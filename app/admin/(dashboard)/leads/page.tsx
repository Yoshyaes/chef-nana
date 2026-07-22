'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useIsMobile } from '@/hooks/useIsMobile'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { useLeadsList, useChangeLeadStage, useGmailImport } from '@/hooks/admin/useLeads'
import LeadCard from '@/components/admin/LeadCard'
import StageSheet from '@/components/admin/StageSheet'
import AddLeadSheet from '@/components/admin/AddLeadSheet'
import SwipeRow from '@/components/admin/ui/SwipeRow'
import Button from '@/components/admin/ui/Button'
import SearchBar from '@/components/admin/ui/SearchBar'
import EmptyState from '@/components/admin/ui/EmptyState'
import QueryError from '@/components/admin/ui/QueryError'
import { StagePill } from '@/components/admin/ui/Chip'
import { SkeletonCard } from '@/components/admin/ui/Skeleton'

export default function LeadsPage() {
  const isMobile = useIsMobile()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [stageSheetLeadId, setStageSheetLeadId] = useState<string | null>(null)

  const leadsQuery = useLeadsList()
  const changeStage = useChangeLeadStage()
  const gmailImport = useGmailImport()

  const { pullDistance, refreshing, handlers } = usePullToRefresh(() => leadsQuery.refetch())

  const leads = leadsQuery.data ?? []
  const filtered = leads.filter(l =>
    !search ||
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.organization ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const stageSheetLead = leads.find(l => l.id === stageSheetLeadId)

  return (
    <div {...handlers}>
      {(pullDistance > 0 || refreshing) && (
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', height: pullDistance, overflow: 'hidden' }}>
          {refreshing ? 'Refreshing…' : '↓ Pull to refresh'}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: isMobile ? 24 : 26, color: 'var(--brown)', fontWeight: 500 }}>
          All Leads ({leads.length})
        </h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button size="sm" variant="ghost" onClick={() => gmailImport.mutate()} disabled={gmailImport.isPending}>
            {gmailImport.isPending ? 'Importing…' : '↓ Gmail (60d)'}
          </Button>
          <Button size="sm" onClick={() => setShowAddSheet(true)}>+ Add lead</Button>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search leads…" />
      </div>

      {leadsQuery.isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : leadsQuery.isError ? (
        <QueryError message="Couldn't load leads." onRetry={() => leadsQuery.refetch()} />
      ) : filtered.length === 0 && leads.length === 0 ? (
        <EmptyState icon="◈" title="No leads yet" subtitle="Add your first lead, or import from Gmail / Apollo in Settings." action={<Button onClick={() => setShowAddSheet(true)}>+ Add lead</Button>} />
      ) : filtered.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          No leads match &ldquo;{search}&rdquo;.
        </div>
      ) : isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(lead => (
            <SwipeRow key={lead.id} onSwipeLeft={() => setStageSheetLeadId(lead.id)} leftLabel="⇅ Stage">
              <div onClick={() => router.push(`/admin/leads/${lead.id}`)} style={{ cursor: 'pointer' }}>
                <LeadCard lead={lead} />
              </div>
            </SwipeRow>
          ))}
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-hairline)', background: 'var(--surface-alt)' }}>
                {['Name', 'Organization', 'Market', 'Stage', 'Fit', 'Value/yr', 'Source'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr key={lead.id} style={{ borderBottom: '1px solid var(--chip-bg)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <Link href={`/admin/leads/${lead.id}`} style={{ color: 'var(--brown)', fontWeight: 500, textDecoration: 'none' }}>
                      {lead.name}
                    </Link>
                    {lead.is_recurring && <span style={{ fontSize: 10, background: '#e8f0ea', color: 'var(--success)', padding: '1px 5px', borderRadius: 4, marginLeft: 6 }}>Recurring</span>}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted-2)' }}>{lead.organization ?? '—'}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted-2)' }}>{lead.market ?? '—'}</td>
                  <td style={{ padding: '12px 16px' }}><StagePill stage={lead.stage} /></td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: lead.fit_score != null && lead.fit_score >= 80 ? 'var(--success)' : 'var(--gold)' }}>
                    {lead.fit_score != null ? `${lead.fit_score}` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted-2)' }}>
                    {lead.est_annual_value ? `$${(lead.est_annual_value / 1000).toFixed(0)}k` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 11 }}>{lead.source ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddLeadSheet open={showAddSheet} onOpenChange={setShowAddSheet} />

      <StageSheet
        open={!!stageSheetLeadId}
        onOpenChange={open => { if (!open) setStageSheetLeadId(null) }}
        currentStage={stageSheetLead?.stage}
        onSelect={stage => { if (stageSheetLeadId) changeStage.mutate({ id: stageSheetLeadId, stage }) }}
      />
    </div>
  )
}
