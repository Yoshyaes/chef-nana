'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIsMobile } from '@/hooks/useIsMobile'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { useLeadsList, useChangeLeadStage } from '@/hooks/admin/useLeads'
import { STAGES } from '@/lib/admin/stages'
import LeadCard from '@/components/admin/LeadCard'
import StageSheet from '@/components/admin/StageSheet'
import AddLeadSheet from '@/components/admin/AddLeadSheet'
import SwipeRow from '@/components/admin/ui/SwipeRow'
import Button from '@/components/admin/ui/Button'
import SearchBar from '@/components/admin/ui/SearchBar'
import { SkeletonCard } from '@/components/admin/ui/Skeleton'

export default function PipelinePage() {
  const isMobile = useIsMobile()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [mobileStage, setMobileStage] = useState<string>(STAGES[0].key)
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [stageSheetLeadId, setStageSheetLeadId] = useState<string | null>(null)

  const leadsQuery = useLeadsList()
  const changeStage = useChangeLeadStage()

  const { pullDistance, refreshing, handlers } = usePullToRefresh(() => leadsQuery.refetch())

  const leads = leadsQuery.data ?? []
  const filtered = leads.filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()) || (l.organization ?? '').toLowerCase().includes(search.toLowerCase()))
  const stageSheetLead = leads.find(l => l.id === stageSheetLeadId)

  return (
    <div {...handlers}>
      {(pullDistance > 0 || refreshing) && (
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', height: pullDistance, overflow: 'hidden' }}>
          {refreshing ? 'Refreshing…' : '↓ Pull to refresh'}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: isMobile ? 24 : 26, color: 'var(--brown)', fontWeight: 500 }}>Pipeline</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          {!isMobile && <div style={{ width: 200 }}><SearchBar value={search} onChange={setSearch} placeholder="Search leads…" /></div>}
          <Button size="sm" onClick={() => setShowAddSheet(true)}>+ Add lead</Button>
        </div>
      </div>
      {isMobile && <div style={{ marginBottom: 16 }}><SearchBar value={search} onChange={setSearch} placeholder="Search leads…" /></div>}

      {isMobile ? (
        <>
          {/* Segmented stage pager, replaces the desktop kanban columns */}
          <div style={{
            display: 'flex', gap: 4, overflowX: 'auto', marginBottom: 16,
            borderBottom: '1px solid var(--border-hairline)', position: 'sticky', top: 0,
            background: 'var(--cream)', zIndex: 2, paddingTop: 2,
          }}>
            {STAGES.map(stage => {
              const count = filtered.filter(l => l.stage === stage.key).length
              const active = mobileStage === stage.key
              return (
                <button
                  key={stage.key}
                  onClick={() => setMobileStage(stage.key)}
                  style={{
                    padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer',
                    fontSize: 12.5, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap',
                    color: active ? 'var(--brown)' : 'var(--text-muted)',
                    borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent',
                    marginBottom: -1,
                  }}
                >
                  {stage.label} {count > 0 && <b style={{ color: active ? 'var(--gold)' : 'var(--text-muted)' }}>{count}</b>}
                </button>
              )
            })}
          </div>

          {leadsQuery.isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.filter(l => l.stage === mobileStage).map(lead => (
                <SwipeRow key={lead.id} onSwipeLeft={() => setStageSheetLeadId(lead.id)} leftLabel="⇅ Stage">
                  <div onClick={() => router.push(`/admin/leads/${lead.id}`)} style={{ cursor: 'pointer' }}>
                    <LeadCard lead={lead} />
                  </div>
                </SwipeRow>
              ))}
              {filtered.filter(l => l.stage === mobileStage).length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No leads in this stage</div>
              )}
            </div>
          )}
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, alignItems: 'start' }}>
          {STAGES.map(stage => {
            const col = filtered.filter(l => l.stage === stage.key)
            return (
              <div key={stage.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown)' }}>{stage.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{col.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {col.map(lead => (
                    <div key={lead.id} onClick={() => router.push(`/admin/leads/${lead.id}`)} style={{ cursor: 'pointer' }}>
                      <LeadCard lead={lead} />
                    </div>
                  ))}
                  {col.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '12px 0', textAlign: 'center' }}>—</div>}
                </div>
              </div>
            )
          })}
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
