'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Profile { id: string; full_name: string; role: string; avatar_color: string }
interface Task {
  id: string
  title: string
  notes: string | null
  status: 'open' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  owner_id: string
  created_by: string
  due_date: string | null
  lead: { id: string; name: string } | null
  menu: { id: string; title: string } | null
}

const STATUSES = ['open', 'in_progress', 'done'] as const
const PRIORITIES = ['low', 'medium', 'high'] as const

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/tasks/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setTask(d)
        if (d) {
          setTitle(d.title)
          setNotes(d.notes ?? '')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    fetch('/api/admin/profiles').then(r => r.ok ? r.json() : []).then(setProfiles)
  }, [])

  async function patch(updates: Record<string, unknown>) {
    setTask(prev => (prev ? { ...prev, ...updates } as Task : prev))
    const res = await fetch(`/api/admin/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) setTask(await res.json())
  }

  async function handleDelete() {
    if (!task) return
    if (!confirm(`Delete "${task.title}"? This can't be undone.`)) return
    setDeleting(true)
    await fetch(`/api/admin/tasks/${id}`, { method: 'DELETE' })
    router.push('/admin/tasks')
  }

  if (loading) return <div style={{ color: '#9a7d5a', padding: 40 }}>Loading…</div>
  if (!task) return <div style={{ color: '#B85A35', padding: 40 }}>Task not found.</div>

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <Link href="/admin/tasks" style={{ fontSize: 13, color: '#9a7d5a', textDecoration: 'none' }}>← All tasks</Link>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={() => { if (title.trim() && title !== task.title) patch({ title: title.trim() }) }}
            style={{
              fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--brown)', fontWeight: 400,
              border: 'none', outline: 'none', width: '100%', marginBottom: 16, background: 'transparent', padding: 0,
            }}
          />

          {(task.lead || task.menu) && (
            <div style={{ marginBottom: 16 }}>
              <Link
                href={task.lead ? `/admin/leads/${task.lead.id}` : `/admin/menus/${task.menu?.id}`}
                style={{ fontSize: 12, background: '#f5ede0', color: '#7a6652', padding: '4px 10px', borderRadius: 6, textDecoration: 'none' }}
              >
                {task.lead ? `Lead: ${task.lead.name}` : `Menu: ${task.menu?.title}`} ↗
              </Link>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: '#9a7d5a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Notes</div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={() => { if (notes !== (task.notes ?? '')) patch({ notes: notes || null }) }}
              placeholder="Add notes…"
              rows={5}
              style={{ width: '100%', padding: 12, border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 14, color: 'var(--brown)', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        <div style={{ width: 240, flexShrink: 0 }}>
          <div style={{ background: '#fff', border: '1px solid #eee5d7', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 11, color: '#9a7d5a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Status</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => patch({ status: s })}
                  style={{
                    padding: '7px 12px', borderRadius: 8, border: '1px solid',
                    borderColor: task.status === s ? 'var(--gold)' : '#e5d9c9',
                    background: task.status === s ? 'rgba(201,151,58,0.1)' : 'transparent',
                    color: task.status === s ? 'var(--brown)' : '#9a7d5a',
                    fontSize: 12, cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  {s === 'in_progress' ? 'In progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 11, color: '#9a7d5a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Priority</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {PRIORITIES.map(p => (
                <button
                  key={p}
                  onClick={() => patch({ priority: p })}
                  style={{
                    padding: '7px 12px', borderRadius: 8, border: '1px solid',
                    borderColor: task.priority === p ? 'var(--gold)' : '#e5d9c9',
                    background: task.priority === p ? 'rgba(201,151,58,0.1)' : 'transparent',
                    color: task.priority === p ? 'var(--brown)' : '#9a7d5a',
                    fontSize: 12, cursor: 'pointer', textAlign: 'left', textTransform: 'capitalize',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 11, color: '#9a7d5a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Owner</div>
            <select
              value={task.owner_id}
              onChange={e => patch({ owner_id: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, marginBottom: 20, background: '#fff' }}
            >
              {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>

            <div style={{ fontSize: 11, color: '#9a7d5a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Due date</div>
            <input
              type="date"
              value={task.due_date ?? ''}
              onChange={e => patch({ due_date: e.target.value || null })}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5d9c9', borderRadius: 8, fontSize: 13, marginBottom: 20, background: '#fff' }}
            />

            <div style={{ paddingTop: 16, borderTop: '1px solid #eee5d7' }}>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ width: '100%', padding: '8px 12px', background: 'transparent', color: '#B85A35', border: '1px solid #f0d5cc', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}
              >
                {deleting ? 'Deleting…' : 'Delete task'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
