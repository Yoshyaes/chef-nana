'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface Profile { id: string; full_name: string; role: string; avatar_color: string }

export interface Task {
  id: string
  title: string
  status: 'open' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  owner_id: string
  due_date: string | null
  lead: { id: string; name: string } | null
  menu: { id: string; title: string } | null
}

export interface TaskFilters {
  view: 'mine' | 'all' | 'overdue'
  owner?: string
  status?: string
  showDone?: boolean
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed (${res.status})`)
  }
  return res.json()
}

export function useTasksList(filters: TaskFilters) {
  const params = new URLSearchParams({ view: filters.view })
  if (filters.owner) params.set('owner', filters.owner)
  if (filters.status) params.set('status', filters.status)
  if (filters.showDone) params.set('showDone', 'true')

  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => fetchJson<Task[]>(`/api/admin/tasks?${params}`),
  })
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: () => fetchJson<Profile[]>('/api/admin/profiles'),
  })
}

export function useAddTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { title: string; owner_id: string; due_date: string | null }) =>
      fetchJson('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task added')
    },
    onError: err => toast.error(err instanceof Error ? err.message : 'Could not add task'),
  })
}

export function useToggleTaskDone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task['status'] }) =>
      fetchJson(`/api/admin/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['tasks'] })
      const previous = qc.getQueriesData<Task[]>({ queryKey: ['tasks'] })
      qc.setQueriesData<Task[] | undefined>({ queryKey: ['tasks'] }, prev =>
        prev?.map(t => (t.id === id ? { ...t, status } : t))
      )
      return { previous }
    },
    onError: (err, _vars, context) => {
      context?.previous.forEach(([key, data]) => qc.setQueryData(key, data))
      toast.error(err instanceof Error ? err.message : 'Could not update task')
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
