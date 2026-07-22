'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface DraftListItem {
  id: string
  lead_id: string
  subject: string
  body: string
  reasoning: string | null
  status: 'pending' | 'edited' | 'rejected' | 'sent'
  channel: string
  created_at: string
  leads: { name: string; organization: string | null; fit_score: number | null; market: string | null } | null
}

export interface DraftDetail extends Omit<DraftListItem, 'leads'> {
  leads: {
    id: string
    name: string
    organization: string | null
    market: string | null
    email: string | null
    fit_score: number | null
  } | null
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed (${res.status})`)
  }
  return res.json()
}

export function useDraftsList() {
  return useQuery({
    queryKey: ['drafts'],
    queryFn: () => fetchJson<DraftListItem[]>('/api/admin/drafts'),
  })
}

export function useDraft(id: string | undefined) {
  return useQuery({
    queryKey: ['draft', id],
    queryFn: () => fetchJson<DraftDetail>(`/api/admin/drafts/${id}`),
    enabled: !!id,
  })
}

function useRemoveDraftMutation(action: 'approve' | 'reject', successMessage: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/admin/drafts/${id}/${action}`, { method: 'POST' }),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['drafts'] })
      const previous = qc.getQueryData<DraftListItem[]>(['drafts'])
      qc.setQueryData<DraftListItem[]>(['drafts'], prev => prev?.filter(d => d.id !== id))
      return { previous }
    },
    onError: (err, _id, context) => {
      if (context?.previous) qc.setQueryData(['drafts'], context.previous)
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    },
    onSuccess: () => {
      toast.success(successMessage)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['drafts'] })
    },
  })
}

export function useApproveDraft() {
  return useRemoveDraftMutation('approve', 'Draft approved & sent')
}

export function useRejectDraft() {
  return useRemoveDraftMutation('reject', 'Draft rejected')
}

export function useSaveDraftEdit(id: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { subject: string; body: string }) =>
      fetchJson<DraftDetail>(`/api/admin/drafts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: updated => {
      qc.setQueryData<DraftDetail | undefined>(['draft', id], prev => prev ? { ...prev, ...updated } : prev)
      qc.setQueryData<DraftListItem[] | undefined>(['drafts'], prev =>
        prev?.map(d => (d.id === id ? { ...d, ...updated } : d))
      )
      toast.success('Draft updated')
    },
    onError: err => toast.error(err instanceof Error ? err.message : 'Save failed'),
  })
}

// Redraft generation runs async (Inngest), so there's no completion signal —
// poll the detail query a handful of times, same pattern the Today brief
// refresh uses for its own async regeneration.
export function useRedraftDraft(id: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => fetchJson(`/api/admin/drafts/${id}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 1 }),
    }),
    onSuccess: () => {
      toast.success('Redrafting — this can take a few seconds')
      let attempts = 0
      const poll = setInterval(() => {
        attempts += 1
        qc.invalidateQueries({ queryKey: ['draft', id] })
        if (attempts >= 6) clearInterval(poll)
      }, 3000)
    },
    onError: err => toast.error(err instanceof Error ? err.message : 'Redraft failed'),
  })
}
