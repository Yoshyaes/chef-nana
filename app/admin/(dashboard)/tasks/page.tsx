'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { localDateString } from '@/lib/dates'
import { useTasksList, useProfiles, useAddTask, useToggleTaskDone, type Task, type TaskFilters } from '@/hooks/admin/useTasks'
import Card from '@/components/admin/ui/Card'
import Button from '@/components/admin/ui/Button'
import EmptyState from '@/components/admin/ui/EmptyState'
import QueryError from '@/components/admin/ui/QueryError'
import { SkeletonRow } from '@/components/admin/ui/Skeleton'
import SwipeRow from '@/components/admin/ui/SwipeRow'

const TABS: { key: TaskFilters['view']; label: string }[] = [
  { key: 'mine', label: 'My Tasks' },
  { key: 'all', label: 'All' },
  { key: 'overdue', label: 'Overdue' },
]

const PRIORITY_COLORS: Record<string, string> = { low: 'var(--text-muted)', medium: 'var(--gold)', high: 'var(--danger)' }
const today = () => localDateString()

export default function TasksPage() {
  const { profile: me } = useCurrentProfile()
  const [tab, setTab] = useState<TaskFilters['view']>('mine')
  const [ownerFilter, setOwnerFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showDone, setShowDone] = useState(false)
  const [quickTitle, setQuickTitle] = useState('')
  const [quickOwner, setQuickOwner] = useState('')
  const [quickDue, setQuickDue] = useState('')

  const tasksQuery = useTasksList({ view: tab, owner: ownerFilter, status: statusFilter, showDone })
  const profilesQuery = useProfiles()
  const addTask = useAddTask()
  const toggleDone = useToggleTaskDone()

  const tasks = tasksQuery.data ?? []
  const profiles = profilesQuery.data ?? []
  const profileById = (id: string) => profiles.find(p => p.id === id)

  // Defaults the quick-add owner to "me" once profile loads, without storing
  // it in state via an effect — quickOwner stays empty until the user picks
  // someone else, and this derived value fills the gap either way.
  const effectiveQuickOwner = quickOwner || me?.id || ''

  function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!quickTitle.trim()) return
    addTask.mutate({ title: quickTitle.trim(), owner_id: effectiveQuickOwner, due_date: quickDue || null }, {
      onSuccess: () => { setQuickTitle(''); setQuickDue('') },
    })
  }

  function handleToggle(task: Task) {
    toggleDone.mutate({ id: task.id, status: task.status === 'done' ? 'open' : 'done' })
  }

  const isOverdue = (task: Task) => !!task.due_date && task.status !== 'done' && task.due_date < today()

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--brown)', fontWeight: 500 }}>Tasks</h1>
      </div>

      <form onSubmit={handleQuickAdd} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          placeholder="Add a task and press Enter…"
          value={quickTitle}
          onChange={e => setQuickTitle(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '10px 12px', border: '1px solid var(--border-hairline)', borderRadius: 8, fontSize: 14, background: 'var(--surface)' }}
        />
        <select
          value={effectiveQuickOwner}
          onChange={e => setQuickOwner(e.target.value)}
          style={{ padding: '10px 12px', border: '1px solid var(--border-hairline)', borderRadius: 8, fontSize: 13, background: 'var(--surface)' }}
        >
          {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </select>
        <input
          type="date"
          value={quickDue}
          onChange={e => setQuickDue(e.target.value)}
          style={{ padding: '10px 12px', border: '1px solid var(--border-hairline)', borderRadius: 8, fontSize: 13, background: 'var(--surface)' }}
        />
        <Button type="submit" disabled={addTask.isPending}>{addTask.isPending ? 'Adding…' : '+ Add'}</Button>
      </form>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12, borderBottom: '1px solid var(--border-hairline)' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 500,
              color: tab === t.key ? 'var(--brown)' : 'var(--text-muted)',
              borderBottom: tab === t.key ? '2px solid var(--gold)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={ownerFilter}
          onChange={e => setOwnerFilter(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid var(--border-hairline)', borderRadius: 8, fontSize: 12, background: 'var(--surface)', color: 'var(--text-muted-2)' }}
        >
          <option value="">All owners</option>
          {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid var(--border-hairline)', borderRadius: 8, fontSize: 12, background: 'var(--surface)', color: 'var(--text-muted-2)' }}
        >
          <option value="">Any status</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted-2)' }}>
          <input type="checkbox" checked={showDone} onChange={e => setShowDone(e.target.checked)} />
          Show done
        </label>
      </div>

      {tasksQuery.isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : tasksQuery.isError ? (
        <QueryError message="Couldn't load tasks." onRetry={() => tasksQuery.refetch()} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon="☑"
          title="Nothing here"
          subtitle={tab === 'mine' ? 'No open tasks assigned to you.' : tab === 'overdue' ? 'Nothing overdue.' : 'No tasks yet.'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.map(task => {
            const owner = profileById(task.owner_id)
            const overdue = isOverdue(task)
            return (
              <SwipeRow key={task.id} onSwipeRight={() => handleToggle(task)} rightLabel={task.status === 'done' ? '↺ Reopen' : '✓ Complete'}>
                <Card style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                  <button
                    onClick={() => handleToggle(task)}
                    aria-label="Toggle done"
                    style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                      border: `2px solid ${task.status === 'done' ? 'var(--success)' : 'var(--border-hairline)'}`,
                      background: task.status === 'done' ? 'var(--success)' : 'transparent',
                      color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {task.status === 'done' ? '✓' : ''}
                  </button>

                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[task.priority], flexShrink: 0 }} />

                  <Link href={`/admin/tasks/${task.id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
                    <div style={{
                      fontSize: 14, color: 'var(--brown)', fontWeight: 500,
                      textDecoration: task.status === 'done' ? 'line-through' : 'none',
                      opacity: task.status === 'done' ? 0.5 : 1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {task.title}
                    </div>
                  </Link>

                  {(task.lead || task.menu) && (
                    <span style={{ fontSize: 11, background: 'var(--chip-bg)', color: 'var(--text-muted-2)', padding: '2px 8px', borderRadius: 6, flexShrink: 0 }}>
                      {task.lead ? task.lead.name : task.menu?.title}
                    </span>
                  )}

                  {owner && (
                    <span title={owner.full_name} style={{
                      width: 24, height: 24, borderRadius: '50%', background: owner.avatar_color, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0,
                    }}>
                      {owner.full_name.charAt(0).toUpperCase()}
                    </span>
                  )}

                  {task.due_date && (
                    <span style={{ fontSize: 12, color: overdue ? 'var(--danger)' : 'var(--text-muted)', fontWeight: overdue ? 600 : 400, flexShrink: 0, width: 70, textAlign: 'right' }}>
                      {new Date(task.due_date + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </Card>
              </SwipeRow>
            )
          })}
        </div>
      )}
    </div>
  )
}
