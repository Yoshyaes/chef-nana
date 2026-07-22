'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface Lead {
  id: string
  name: string
  organization: string | null
  type: string | null
  market: string | null
  fit_score: number | null
  est_annual_value: number | null
  stage: string
  is_recurring: boolean
  email: string | null
  source: string | null
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed (${res.status})`)
  }
  return res.json()
}

export function useLeadsList() {
  return useQuery({
    queryKey: ['leads'],
    queryFn: () => fetchJson<Lead[]>('/api/admin/leads'),
  })
}

export function useAddLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; organization: string; email: string; market: string; type: string }) =>
      fetchJson<Lead>('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, source: 'manual' }),
      }),
    onSuccess: newLead => {
      qc.setQueryData<Lead[] | undefined>(['leads'], prev => (prev ? [newLead, ...prev] : prev))
      toast.success(`${newLead.name} added`)
    },
    onError: err => toast.error(err instanceof Error ? err.message : 'Could not add lead'),
  })
}

export function useChangeLeadStage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      fetchJson(`/api/admin/leads/${id}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      }),
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: ['leads'] })
      const previous = qc.getQueryData<Lead[]>(['leads'])
      qc.setQueryData<Lead[] | undefined>(['leads'], prev => prev?.map(l => (l.id === id ? { ...l, stage } : l)))
      return { previous }
    },
    onError: (err, _vars, context) => {
      if (context?.previous) qc.setQueryData(['leads'], context.previous)
      toast.error(err instanceof Error ? err.message : 'Could not change stage')
    },
  })
}

export function useGmailImport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => fetchJson<{ imported: number; skipped: number }>('/api/admin/gmail/import', { method: 'POST' }),
    onSuccess: data => {
      toast.success(`Imported ${data.imported} new lead${data.imported !== 1 ? 's' : ''}, ${data.skipped} already existed`)
      if (data.imported > 0) qc.invalidateQueries({ queryKey: ['leads'] })
    },
    onError: err => toast.error(err instanceof Error ? err.message : 'Gmail import failed'),
  })
}
