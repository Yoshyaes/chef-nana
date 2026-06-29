'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

const OCCASIONS = ['private_dinner', 'catering', 'corporate', 'supper_club', 'holiday']
const CUISINES = ['Ghanaian', 'West African', 'Mediterranean', 'American', 'Pan-African', 'International']
const STATUSES = [
  { value: '', label: 'Active + Draft' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
]

function occasionLabel(v: string) {
  return v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function MenuFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [q, setQ] = useState(searchParams.get('q') ?? '')

  useEffect(() => {
    setQ(searchParams.get('q') ?? '')
  }, [searchParams])

  function buildParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    return params.toString()
  }

  const handleSearch = useCallback((value: string) => {
    setQ(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.replace(`${pathname}?${buildParams({ q: value })}`)
    }, 300)
  }, [pathname, searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleFilter(key: string, value: string) {
    router.replace(`${pathname}?${buildParams({ [key]: value })}`)
  }

  const selectStyle = {
    padding: '8px 12px',
    border: '1px solid #e5d9c9',
    borderRadius: 8,
    fontSize: 13,
    color: 'var(--brown)',
    background: '#fff',
    cursor: 'pointer',
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <input
        placeholder="Search menus and dishes..."
        value={q}
        onChange={e => handleSearch(e.target.value)}
        style={{
          padding: '8px 12px',
          border: '1px solid #e5d9c9',
          borderRadius: 8,
          fontSize: 13,
          color: 'var(--brown)',
          background: '#fff',
          width: 220,
        }}
      />

      <select
        value={searchParams.get('occasion') ?? ''}
        onChange={e => handleFilter('occasion', e.target.value)}
        style={selectStyle}
      >
        <option value="">All occasions</option>
        {OCCASIONS.map(o => (
          <option key={o} value={o}>{occasionLabel(o)}</option>
        ))}
      </select>

      <select
        value={searchParams.get('cuisine') ?? ''}
        onChange={e => handleFilter('cuisine', e.target.value)}
        style={selectStyle}
      >
        <option value="">All cuisines</option>
        {CUISINES.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        value={searchParams.get('status') ?? ''}
        onChange={e => handleFilter('status', e.target.value)}
        style={selectStyle}
      >
        {STATUSES.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, color: '#9a7d5a' }}>Guests:</span>
        <input
          type="number"
          min={1}
          placeholder="any"
          value={searchParams.get('guests') ?? ''}
          onChange={e => handleFilter('guests', e.target.value)}
          style={{ ...selectStyle, width: 70 }}
        />
      </div>
    </div>
  )
}
