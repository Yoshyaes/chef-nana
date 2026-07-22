'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { localDateString } from '@/lib/dates'

export interface TriageAction {
  priority: 'hot' | 'warm' | 'cool'
  type: string
  title: string
  description: string
  leadId?: string
  draftId?: string
}

export interface Triage {
  tldr: string
  actions: TriageAction[]
  stats: { hotReplies: number; draftsToApprove: number; followUpsDue: number; activeLeads: number }
  generated_at: string
}

export interface DueTodayTask {
  id: string
  title: string
  priority: 'low' | 'medium' | 'high'
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed (${res.status})`)
  }
  return res.json()
}

export function useTriage() {
  return useQuery({
    queryKey: ['triage'],
    queryFn: () => fetchJson<Triage | null>('/api/admin/triage'),
  })
}

// Triage regeneration runs async (Inngest), so there's no completion signal —
// poll until generated_at moves, same pattern as redraft in useDrafts.ts.
export function useRegenerateTriage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const before = qc.getQueryData<Triage | null>(['triage'])
      await fetchJson('/api/admin/triage', { method: 'POST' })
      return before?.generated_at
    },
    onSuccess: previousGeneratedAt => {
      let attempts = 0
      const poll = setInterval(async () => {
        attempts += 1
        const latest = await qc.fetchQuery({ queryKey: ['triage'], queryFn: () => fetchJson<Triage | null>('/api/admin/triage') })
        if (latest?.generated_at !== previousGeneratedAt || attempts >= 8) {
          clearInterval(poll)
          if (attempts >= 8 && latest?.generated_at === previousGeneratedAt) {
            toast.error('Brief is taking longer than usual — try refreshing again shortly')
          }
        }
      }, 3000)
    },
    onError: err => toast.error(err instanceof Error ? err.message : 'Could not refresh the brief'),
  })
}

export function useDueTodayTasks() {
  return useQuery({
    queryKey: ['tasks', 'dueToday'],
    queryFn: async () => {
      const tasks = await fetchJson<{ id: string; title: string; priority: DueTodayTask['priority']; due_date: string | null }[]>('/api/admin/tasks?view=mine')
      const today = localDateString()
      return tasks.filter(t => t.due_date === today) as DueTodayTask[]
    },
  })
}
