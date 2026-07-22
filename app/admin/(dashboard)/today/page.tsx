'use client'

import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { useTriage, useRegenerateTriage, useDueTodayTasks, type Triage } from '@/hooks/admin/useToday'
import { useApproveDraft } from '@/hooks/admin/useDrafts'
import Card from '@/components/admin/ui/Card'
import Button from '@/components/admin/ui/Button'
import StatTile from '@/components/admin/ui/StatTile'
import SectionHeader from '@/components/admin/ui/SectionHeader'
import EmptyState from '@/components/admin/ui/EmptyState'
import { SkeletonCard } from '@/components/admin/ui/Skeleton'

const priorityDot: Record<string, string> = {
  low: 'var(--text-muted)',
  medium: 'var(--gold)',
  high: 'var(--danger)',
  hot: 'var(--danger)',
  warm: 'var(--gold)',
  cool: 'var(--text-muted)',
}

const typeLabel: Record<string, string> = {
  reply: 'Reply',
  approve: 'Approve',
  followup: 'Follow-up',
  inquiry: 'Inquiry',
}

export default function TodayPage() {
  const isMobile = useIsMobile()
  const qc = useQueryClient()
  const [approvingDraftId, setApprovingDraftId] = useState<string | null>(null)

  const triageQuery = useTriage()
  const regenerate = useRegenerateTriage()
  const dueTodayQuery = useDueTodayTasks()
  const approve = useApproveDraft()

  const { pullDistance, refreshing, handlers } = usePullToRefresh(() => regenerate.mutateAsync())

  const triage = triageQuery.data
  const dueToday = dueTodayQuery.data ?? []
  const isRefreshing = regenerate.isPending || refreshing

  function handleApprove(action: NonNullable<Triage['actions']>[number]) {
    if (!action.draftId) return
    setApprovingDraftId(action.draftId)
    approve.mutate(action.draftId, {
      onSuccess: () => {
        qc.setQueryData<Triage | null | undefined>(['triage'], prev =>
          prev ? { ...prev, actions: prev.actions.filter(a => a.draftId !== action.draftId) } : prev
        )
      },
      onSettled: () => setApprovingDraftId(null),
    })
  }

  return (
    <div
      {...handlers}
      style={{ maxWidth: 720 }}
    >
      {(pullDistance > 0 || refreshing) && (
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', height: pullDistance, overflow: 'hidden' }}>
          {refreshing ? 'Refreshing…' : '↓ Pull to refresh'}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: isMobile ? 26 : 28, color: 'var(--brown)', fontWeight: 500 }}>
            Good morning, Nana
          </h1>
          {triage?.generated_at && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Brief from {new Date(triage.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={() => regenerate.mutate()} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing…' : '↻ Refresh'}
        </Button>
      </div>

      {dueToday.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader style={{ marginBottom: 12 }}>Tasks due today</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dueToday.map(task => (
              <Link key={task.id} href={`/admin/tasks/${task.id}`} style={{ textDecoration: 'none' }}>
                <Card style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: priorityDot[task.priority] ?? '#ccc', flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 14, color: 'var(--brown)', fontWeight: 500 }}>{task.title}</div>
                  <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 500 }}>View →</span>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {(triageQuery.isLoading || isRefreshing) ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !triage ? (
        <EmptyState
          icon="☀"
          title="No brief yet"
          subtitle="Add some leads and refresh the brief to generate your first morning summary."
          action={<Button onClick={() => regenerate.mutate()}>Refresh brief</Button>}
        />
      ) : (
        <>
          {triage.stats && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
              <Link href="/admin/drafts" style={{ textDecoration: 'none' }}>
                <StatTile value={triage.stats.hotReplies} label="Hot replies" />
              </Link>
              <Link href="/admin/drafts" style={{ textDecoration: 'none' }}>
                <StatTile value={triage.stats.draftsToApprove} label="Drafts to approve" accent />
              </Link>
              <Link href="/admin/tasks" style={{ textDecoration: 'none' }}>
                <StatTile value={triage.stats.followUpsDue} label="Follow-ups due" />
              </Link>
              <Link href="/admin/leads" style={{ textDecoration: 'none' }}>
                <StatTile value={triage.stats.activeLeads} label="Active leads" />
              </Link>
            </div>
          )}

          <Card style={{ padding: 20, marginBottom: 18 }}>
            <SectionHeader style={{ marginBottom: 8 }}>TL;DR</SectionHeader>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--brown)', lineHeight: 1.7 }}>
              {triage.tldr}
            </p>
          </Card>

          {triage.actions?.length > 0 && (
            <div>
              <SectionHeader style={{ marginBottom: 12, paddingLeft: 2 }}>Needs you first</SectionHeader>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {triage.actions.map((action, i) => (
                  <Card key={i} style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: priorityDot[action.priority] ?? '#ccc', flexShrink: 0, marginTop: 5 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <div style={{ fontSize: 14, color: 'var(--brown)', fontWeight: 600 }}>{action.title}</div>
                          <span style={{ fontSize: 10.5, color: priorityDot[action.priority], background: 'var(--chip-bg)', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                            {typeLabel[action.type] ?? action.type}
                          </span>
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-muted-2)', marginTop: 3, lineHeight: 1.45 }}>
                          {action.description}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          {action.draftId && (
                            <Button size="sm" variant="green" onClick={() => handleApprove(action)} disabled={approvingDraftId === action.draftId}>
                              {approvingDraftId === action.draftId ? 'Approving…' : 'Approve'}
                            </Button>
                          )}
                          {action.draftId ? (
                            <Link href={`/admin/drafts/${action.draftId}`}>
                              <Button size="sm" variant="ghost">Review →</Button>
                            </Link>
                          ) : action.leadId ? (
                            <Link href={`/admin/leads/${action.leadId}`}>
                              <Button size="sm" variant="ghost">View →</Button>
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
