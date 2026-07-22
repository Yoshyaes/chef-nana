'use client'

import { useEffect, useState } from 'react'

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  debounceMs = 250,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  debounceMs?: number
}) {
  const [draft, setDraft] = useState(value)

  useEffect(() => setDraft(value), [value])

  useEffect(() => {
    const t = setTimeout(() => {
      if (draft !== value) onChange(draft)
    }, debounceMs)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 12px 10px 34px',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-md)',
          fontSize: 14,
          color: 'var(--brown)',
          background: 'var(--surface)',
        }}
      />
      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }}>
        ⌕
      </span>
      {draft && (
        <button
          onClick={() => setDraft('')}
          aria-label="Clear search"
          style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: 4,
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}
