'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useRef, useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import BottomSheet from '@/components/admin/ui/BottomSheet'
import Button from '@/components/admin/ui/Button'
import SearchBar from '@/components/admin/ui/SearchBar'

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
  const isMobile = useIsMobile()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showFilterSheet, setShowFilterSheet] = useState(false)

  // Keep the search box's local echo in sync with the URL (e.g. back/forward
  // navigation) without an effect — adjusting state during render, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const urlQ = searchParams.get('q') ?? ''
  const [prevUrlQ, setPrevUrlQ] = useState(urlQ)
  const [q, setQ] = useState(urlQ)
  if (urlQ !== prevUrlQ) {
    setPrevUrlQ(urlQ)
    setQ(urlQ)
  }

  function buildParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    return params.toString()
  }

  function handleSearch(value: string) {
    setQ(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.replace(`${pathname}?${buildParams({ q: value })}`)
    }, 300)
  }

  function handleFilter(key: string, value: string) {
    router.replace(`${pathname}?${buildParams({ [key]: value })}`)
  }

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1px solid var(--border-hairline)',
    borderRadius: 8,
    fontSize: 13,
    color: 'var(--brown)',
    background: 'var(--surface)',
    cursor: 'pointer',
  }

  const activeFilterCount = ['occasion', 'cuisine', 'status', 'guests'].filter(k => searchParams.get(k)).length

  const filterControls = (
    <>
      <select value={searchParams.get('occasion') ?? ''} onChange={e => handleFilter('occasion', e.target.value)} style={{ ...selectStyle, width: isMobile ? '100%' : undefined }}>
        <option value="">All occasions</option>
        {OCCASIONS.map(o => <option key={o} value={o}>{occasionLabel(o)}</option>)}
      </select>
      <select value={searchParams.get('cuisine') ?? ''} onChange={e => handleFilter('cuisine', e.target.value)} style={{ ...selectStyle, width: isMobile ? '100%' : undefined }}>
        <option value="">All cuisines</option>
        {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select value={searchParams.get('status') ?? ''} onChange={e => handleFilter('status', e.target.value)} style={{ ...selectStyle, width: isMobile ? '100%' : undefined }}>
        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Guests:</span>
        <input
          type="number"
          min={1}
          placeholder="any"
          value={searchParams.get('guests') ?? ''}
          onChange={e => handleFilter('guests', e.target.value)}
          style={{ ...selectStyle, width: isMobile ? '100%' : 70 }}
        />
      </div>
    </>
  )

  if (isMobile) {
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <SearchBar value={q} onChange={handleSearch} placeholder="Search menus and dishes…" />
        </div>
        <Button variant="ghost" onClick={() => setShowFilterSheet(true)}>
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </Button>
        <BottomSheet open={showFilterSheet} onOpenChange={setShowFilterSheet} title="Filter menus">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filterControls}
          </div>
        </BottomSheet>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <input
        placeholder="Search menus and dishes..."
        value={q}
        onChange={e => handleSearch(e.target.value)}
        style={{ ...selectStyle, width: 220 }}
      />
      {filterControls}
    </div>
  )
}
