'use client'

import { useEffect, useMemo, useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import {
  useDraftsList,
  useDraft,
  useApproveDraft,
  useRejectDraft,
  useSaveDraftEdit,
  useRedraftDraft,
} from '@/hooks/admin/useDrafts'
import DraftRow from '@/components/admin/DraftRow'
import SwipeRow from '@/components/admin/ui/SwipeRow'
import Button from '@/components/admin/ui/Button'
import Card from '@/components/admin/ui/Card'
import SearchBar from '@/components/admin/ui/SearchBar'
import EmptyState from '@/components/admin/ui/EmptyState'
import { SkeletonRow } from '@/components/admin/ui/Skeleton'
import type { DraftListItem } from '@/hooks/admin/useDrafts'

const EMPTY_DRAFTS: DraftListItem[] = []

interface Message {
  id: string
  direction: string
  channel: string
  subject: string | null
  body: string
  sent_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function ThreadPanel({ leadId }: { leadId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false
    fetch(`/api/admin/messages?leadId=${leadId}`)
      .then(r => r.json())
      .then(data => { if (!cancelled) setMessages(data) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [leadId])

  if (loading) return <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '8px 0' }}>Loading thread…</div>
  if (messages.length === 0) return null

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        Conversation history ({messages.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map(m => {
          const isInbound = m.direction === 'inbound'
          const isExpanded = expanded[m.id]
          const bodyPreview = m.body.slice(0, 200)
          const hasMore = m.body.length > 200
          return (
            <div key={m.id} style={{
              borderRadius: 10,
              border: `1px solid ${isInbound ? 'var(--border-hairline)' : '#d8e8dc'}`,
              background: isInbound ? 'var(--surface-alt)' : '#f4f9f5',
              padding: '12px 14px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                    color: isInbound ? 'var(--text-muted)' : 'var(--success)',
                    background: isInbound ? 'var(--chip-bg)' : '#e0ede4',
                    padding: '2px 7px', borderRadius: 4,
                  }}>
                    {isInbound ? 'THEIR MESSAGE' : 'NANA'}
                  </span>
                  {m.subject && <span style={{ fontSize: 12, color: 'var(--brown)', fontWeight: 500 }}>{m.subject}</span>}
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: 12 }}>
                  {formatDate(m.sent_at)}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted-2)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {isExpanded ? m.body : bodyPreview}{hasMore && !isExpanded && '…'}
              </div>
              {hasMore && (
                <button
                  onClick={() => setExpanded(e => ({ ...e, [m.id]: !e[m.id] }))}
                  style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {isExpanded ? 'Show less' : 'Show full message'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function DraftsView({ initialId }: { initialId?: string }) {
  const isMobile = useIsMobile()
  const [selectedId, setSelectedId] = useState<string | undefined>(initialId)
  const [mobileView, setMobileView] = useState<'list' | 'detail'>(initialId ? 'detail' : 'list')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [whyExpanded, setWhyExpanded] = useState(true)
  const [showThread, setShowThread] = useState(false)

  const draftsQuery = useDraftsList()
  const draftQuery = useDraft(selectedId)
  const approve = useApproveDraft()
  const reject = useRejectDraft()
  const saveEdit = useSaveDraftEdit(selectedId)
  const redraft = useRedraftDraft(selectedId)

  const { containerRef, pullDistance, refreshing, handlers } = usePullToRefresh(() => draftsQuery.refetch())

  const drafts = draftsQuery.data ?? EMPTY_DRAFTS
  const filtered = useMemo(() => {
    if (!search.trim()) return drafts
    const q = search.toLowerCase()
    return drafts.filter(d =>
      d.leads?.name?.toLowerCase().includes(q) ||
      d.leads?.organization?.toLowerCase().includes(q) ||
      d.subject?.toLowerCase().includes(q)
    )
  }, [drafts, search])

  // On desktop, auto-select the first draft once the list has loaded.
  useEffect(() => {
    if (!isMobile && !selectedId && drafts.length > 0) setSelectedId(drafts[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, drafts.length])

  function selectDraft(id: string) {
    setSelectedId(id)
    setEditing(false)
    setShowThread(false)
    setWhyExpanded(true)
    if (isMobile) setMobileView('detail')
  }

  function handleApprove(id: string) {
    approve.mutate(id, {
      onSuccess: () => {
        if (selectedId === id) {
          setSelectedId(undefined)
          if (isMobile) setMobileView('list')
        }
      },
    })
  }

  function handleReject(id: string) {
    reject.mutate(id, {
      onSuccess: () => {
        if (selectedId === id) {
          setSelectedId(undefined)
          if (isMobile) setMobileView('list')
        }
      },
    })
  }

  function startEdit() {
    if (!draftQuery.data) return
    setEditBody(draftQuery.data.body)
    setEditSubject(draftQuery.data.subject)
    setEditing(true)
  }

  const actionLoading = approve.isPending || reject.isPending || saveEdit.isPending || redraft.isPending

  // ── List ──────────────────────────────────────────────────────
  const DraftList = (
    <div
      ref={containerRef}
      {...handlers}
      style={{
        background: 'var(--surface-alt)',
        ...(isMobile ? {} : { width: 320, borderRight: '1px solid var(--border-hairline)', overflowY: 'auto', flexShrink: 0 }),
      }}
    >
      <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--brown)', fontWeight: 500 }}>
          Drafts <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>{drafts.length}</span>
        </h2>
      </div>
      <div style={{ padding: '0 16px 12px' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search sender or subject…" />
      </div>
      {(pullDistance > 0 || refreshing) && (
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', height: pullDistance, overflow: 'hidden', transition: refreshing ? 'none' : 'height 0.2s' }}>
          {refreshing ? 'Refreshing…' : '↓ Pull to refresh'}
        </div>
      )}
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {draftsQuery.isLoading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

        {!draftsQuery.isLoading && filtered.length === 0 && drafts.length === 0 && (
          <EmptyState icon="✦" title="No pending drafts" subtitle="New AI-drafted replies will show up here as they're generated." />
        )}

        {!draftsQuery.isLoading && filtered.length === 0 && drafts.length > 0 && (
          <div style={{ padding: '24px 4px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
            No drafts match &ldquo;{search}&rdquo;.
          </div>
        )}

        {filtered.map(d => (
          <div key={d.id} onClick={() => selectDraft(d.id)} style={{ cursor: 'pointer' }}>
            <SwipeRow onSwipeRight={() => handleApprove(d.id)} onSwipeLeft={() => handleReject(d.id)}>
              <DraftRow draft={d} selected={!isMobile && selectedId === d.id} />
            </SwipeRow>
          </div>
        ))}
      </div>
    </div>
  )

  // ── Detail ────────────────────────────────────────────────────
  const detail = draftQuery.data

  let DraftDetail: React.ReactNode
  if (!selectedId) {
    DraftDetail = (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
        Select a draft to review
      </div>
    )
  } else if (draftQuery.isLoading) {
    DraftDetail = (
      <div style={{ flex: 1, padding: isMobile ? 16 : 32 }}>
        <SkeletonRow />
      </div>
    )
  } else if (draftQuery.isError || !detail) {
    DraftDetail = (
      <div style={{ flex: 1, padding: isMobile ? 16 : 32, color: 'var(--text-muted-2)', fontSize: 14 }}>
        That draft couldn&rsquo;t be found — it may have already been approved, rejected, or deleted.
      </div>
    )
  } else {
    DraftDetail = (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0 16px' : '0 32px' }}>
          {isMobile && (
            <button
              onClick={() => setMobileView('list')}
              style={{ fontSize: 13, color: 'var(--brown)', background: 'none', border: 'none', padding: '16px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              ← All drafts
            </button>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: isMobile ? 0 : 24, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>To</div>
              <div style={{ fontWeight: 500, color: 'var(--brown)' }}>{detail.leads?.name ?? 'Unknown lead'}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {[detail.leads?.email, detail.leads?.organization, detail.leads?.market].filter(Boolean).join(' · ')}
              </div>
            </div>
            {detail.lead_id && (
              <button
                onClick={() => setShowThread(t => !t)}
                style={{
                  fontSize: 12, color: showThread ? 'var(--success)' : 'var(--text-muted)',
                  background: showThread ? '#e8f2ec' : 'var(--chip-bg)',
                  border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 500,
                }}
              >
                {showThread ? '▾ Hide thread' : '▸ View thread'}
              </button>
            )}
          </div>

          {showThread && detail.lead_id && <ThreadPanel key={detail.lead_id} leadId={detail.lead_id} />}

          {detail.reasoning && (
            <Card style={{ background: '#FFFBF4', border: '1px solid #F0E3CC', padding: 14, marginBottom: 18 }}>
              <button
                onClick={() => setWhyExpanded(w => !w)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <span style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
                  Why this draft
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{whyExpanded ? '▾' : '▸'}</span>
              </button>
              {whyExpanded && (
                <p style={{ fontSize: 13, color: 'var(--text-muted-2)', lineHeight: 1.6, marginTop: 8 }}>{detail.reasoning}</p>
              )}
            </Card>
          )}

          {editing ? (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Subject</label>
                <input
                  value={editSubject}
                  onChange={e => setEditSubject(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-hairline)', borderRadius: 8, fontSize: 14, color: 'var(--brown)' }}
                />
              </div>
              <textarea
                value={editBody}
                onChange={e => setEditBody(e.target.value)}
                rows={16}
                style={{ width: '100%', padding: 12, border: '1px solid var(--border-hairline)', borderRadius: 8, fontSize: 14, color: 'var(--brown)', lineHeight: 1.7, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Subject</div>
                <div style={{ fontWeight: 600, color: 'var(--brown)', fontSize: 15 }}>{detail.subject}</div>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 10, padding: 20, whiteSpace: 'pre-line', fontSize: 14, color: 'var(--brown)', lineHeight: 1.75, marginBottom: 16 }}>
                {redraft.isPending ? (
                  <span style={{ color: 'var(--text-muted)' }}>Regenerating draft…</span>
                ) : (
                  detail.body
                )}
              </div>
            </>
          )}
        </div>

        {/* Sticky bottom action bar — sticks to the bottom of the scrolling
            ancestor (.admin-main), staying clear of the persistent tab bar. */}
        <div style={{
          position: 'sticky', bottom: 0, flexShrink: 0,
          padding: isMobile ? '12px 16px calc(12px + env(safe-area-inset-bottom))' : '16px 32px',
          background: 'linear-gradient(transparent, var(--cream) 30%)',
          display: 'flex', gap: 8, flexWrap: 'wrap',
        }}>
          {!editing ? (
            <>
              <Button variant="green" onClick={() => handleApprove(detail.id)} disabled={actionLoading}>
                {approve.isPending ? 'Sending…' : 'Approve & send'}
              </Button>
              <Button variant="ghost" onClick={startEdit} disabled={actionLoading}>Edit</Button>
              <Button variant="ghost" onClick={() => redraft.mutate()} disabled={actionLoading}>
                {redraft.isPending ? 'Queuing…' : 'Redraft'}
              </Button>
              <Button variant="danger" onClick={() => handleReject(detail.id)} disabled={actionLoading}>
                {reject.isPending ? 'Rejecting…' : 'Reject'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="brass"
                disabled={actionLoading}
                onClick={() => saveEdit.mutate({ subject: editSubject, body: editBody }, { onSuccess: () => setEditing(false) })}
              >
                {saveEdit.isPending ? 'Saving…' : 'Save edits'}
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </>
          )}
        </div>
      </div>
    )
  }

  if (isMobile) {
    return <div style={{ margin: -16, height: '100%' }}>{mobileView === 'list' ? DraftList : DraftDetail}</div>
  }

  return (
    <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 64px)', margin: -32 }}>
      {DraftList}
      {DraftDetail}
    </div>
  )
}
