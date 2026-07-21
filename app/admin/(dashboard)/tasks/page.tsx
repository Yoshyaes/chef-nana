'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'

interface Profile { id: string; full_name: string; role: string; avatar_color: string }
interface Task {
  id: string
  title: string
  status: 'open' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  owner_id: string
  due_date: string | null
  lead: { id: string; name: string } | null
  menu: { id: string; title: string } | null
}

const TABS = [
  { key: 'mine', label: 'My Tasks' },
  { key: 'all', label: 'All' },
  { key: 'overdue', label: 'Overdue' },
] as const

const PRIORITY_COLORS: Record<string, string> = { low: '#9a7d5a', medium: '#C9973A', high: '#B85A35' }
const today = () => new Date().toISOString().slice(0, 10)

export default function TasksPage() {
  const { profile: me } = useCurrentProfile()
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('mine')
  const [tasks, setTasks] = useState<Task[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [ownerFilter, setOwnerFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showDone, setShowDone] = useState(false)
  const [quickTitle, setQuickTitle] = useState('')
  const [quickOwner, setQuickOwner] = useState('')
  const [quickDue, setQuickDue] = useState('')
  const [adding, setAdding] = useState(false)

  const profileById = useCallback((id: string) => profiles.find(p => p.id === id), [profiles])

  const loadTasks = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ view: tab })
    if (ownerFilter) params.set('owner', ownerFilter)
    if (statusFilter) params.set('status', statusFilter)
    if (showDone) params.set('showDone', 'true')
    fetch(`/api/admin/tasks?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(setTasks)
      .finally(() => setLoading(false))
  }, [tab, ownerFilter, statusFilter, showDone])

  useEffect(() => { loadTasks() }, [loadTasks])

  useEffect(() => {
    fetch('/api/admin/profiles').then(r => r.ok ? r.json() : []).then(setProfiles)
  }, [])

  useEffect(() => {
    if (me && !quickOwner) setQuickOwner(me.id)
  }, [me, quickOwner])

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!quickTitle.trim()) return
    setAdding(true)
    const res = await fetch('/api/admin/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: quickTitle.trim(), owner_id: quickOwner, due_date: quickDue || null }),
    })
    if (res.ok) {
      setQuickTitle('')
      setQuickDue('')
      loadTasks()
    }
    setAdding(false)
  }

  async function toggleDone(task: Task) {
    const nextStatus = task.status === 'done' ? 'open' : 'done'
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t))
    await fetch(`/api/admin/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })
    loadTasks()
  }

  const isOverdue = (task: Task) => !!task.due_date && task.status !== 'done' && task.due_date < today()

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--brown)', fontWeight: 400 }}>Tasks</h1>
      </div>

      <form onSubmit={handleQuickAdd} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          placeholder="Add a task and press Enter…"
          value={quickTitle}
          onChange={e => setQuickTitle(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '10px 12px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 14, background: '#fff' }}
        />
        <select
          value={quickOwner}
          onChange={e => setQuickOwner(e.target.value)}
          style={{ padding: '10px 12px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, background: '#fff' }}
        >
          {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </select>
        <input
          type="date"
          value={quickDue}
          onChange={e => setQuickDue(e.target.value)}
          style={{ padding: '10px 12px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, background: '#fff' }}
        />
        <button
          type="submit"
          disabled={adding}
          style={{ padding: '10px 18px', background: 'var(--brown)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
        >
          {adding ? 'Adding…' : '+ Add'}
        </button>
      </form>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12, borderBottom: '1px solid #eee5d7' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 500,
              color: tab === t.key ? 'var(--brown)' : '#9a7d5a',
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
          style={{ padding: '6px 10px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 12, background: '#fff', color: '#7a6652' }}
        >
          <option value="">All owners</option>
          {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 12, background: '#fff', color: '#7a6652' }}
        >
          <option value="">Any status</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#7a6652' }}>
          <input type="checkbox" checked={showDone} onChange={e => setShowDone(e.target.checked)} />
          Show done
        </label>
      </div>

      {loading ? (
        <div style={{ color: '#9a7d5a', padding: 40 }}>Loading tasks…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.map(task => {
            const owner = profileById(task.owner_id)
            const overdue = isOverdue(task)
            return (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #eee5d7', borderRadius: 10, padding: '12px 16px' }}>
                <button
                  onClick={() => toggleDone(task)}
                  aria-label="Toggle done"
                  style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                    border: `2px solid ${task.status === 'done' ? '#2D5F3D' : '#e5d9c9'}`,
                    background: task.status === 'done' ? '#2D5F3D' : 'transparent',
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
                  <span style={{ fontSize: 11, background: '#f5ede0', color: '#7a6652', padding: '2px 8px', borderRadius: 6, flexShrink: 0 }}>
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
                  <span style={{ fontSize: 12, color: overdue ? '#B85A35' : '#9a7d5a', fontWeight: overdue ? 600 : 400, flexShrink: 0, width: 70, textAlign: 'right' }}>
                    {new Date(task.due_date + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            )
          })}
          {tasks.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: '#9a7d5a', fontSize: 14 }}>
              {tab === 'mine' ? 'No open tasks assigned to you.' : tab === 'overdue' ? 'Nothing overdue.' : 'No tasks yet.'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
