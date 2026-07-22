'use client'

import { useQuery } from '@tanstack/react-query'

export function useApiSpend() {
  return useQuery({
    queryKey: ['settings', 'spend'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) return { current: 0, cap: 25 }
      const d = await res.json()
      return { current: d.current_month_spend ?? 0, cap: d.monthly_budget_cap ?? 25 }
    },
  })
}
