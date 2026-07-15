'use client'

import { useEffect, useRef, useState } from 'react'

interface Asset { path: string; type: string; uploadedAt: string; signedUrl?: string | null }
interface Dish { name: string; description: string; dietary: string[]; allergens: string[] }
interface Course { name: string; dishes: Dish[] }

interface ExtractResult { title: string | null; courses: Course[] }

interface Props {
  photos: Asset[]
  onExtracted: (result: ExtractResult) => void
}

const POLL_INTERVAL_MS = 2000
const MAX_POLLS = 45 // ~90s before giving up

export default function MenuPhotoExtractor({ photos, onExtracted }: Props) {
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const cancelledRef = useRef(false)

  useEffect(() => {
    return () => { cancelledRef.current = true }
  }, [])

  async function handleExtract() {
    if (photos.length === 0 || status === 'working') return
    cancelledRef.current = false
    setStatus('working')
    setErrorMsg('')

    try {
      const res = await fetch('/api/admin/menus/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos: photos.map(p => ({ path: p.path, type: p.type })) }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Could not start extraction' }))
        throw new Error(err.error ?? 'Could not start extraction')
      }
      const { extractionId } = await res.json()

      for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
        if (cancelledRef.current) return
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
        if (cancelledRef.current) return

        const pollRes = await fetch(`/api/admin/menus/extract/${extractionId}`)
        if (!pollRes.ok) continue
        const data = await pollRes.json()

        if (data.status === 'done') {
          onExtracted(data.result)
          setStatus('idle')
          return
        }
        if (data.status === 'error') {
          throw new Error(data.error ?? 'Could not read this menu')
        }
      }

      throw new Error('Extraction is taking longer than expected. Try again in a moment.')
    } catch (e) {
      if (cancelledRef.current) return
      setErrorMsg(e instanceof Error ? e.message : 'Extraction failed')
      setStatus('error')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          onClick={handleExtract}
          disabled={photos.length === 0 || status === 'working'}
          style={{
            padding: '8px 16px',
            background: status === 'working' ? '#f5ede0' : 'transparent',
            border: '1px solid var(--gold)',
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 500,
            color: photos.length === 0 ? '#c9b79a' : 'var(--gold)',
            cursor: photos.length === 0 || status === 'working' ? 'default' : 'pointer',
          }}
        >
          {status === 'working' ? 'Extracting…' : '✨ Extract from photos'}
        </button>
        {photos.length === 0 && (
          <span style={{ fontSize: 11, color: '#b0a090' }}>Upload a photo first</span>
        )}
      </div>

      {status === 'error' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
          <span style={{ color: '#B85A35' }}>{errorMsg}</span>
          <button
            type="button"
            onClick={handleExtract}
            style={{ padding: '2px 10px', border: '1px solid #e5d9c9', borderRadius: 6, background: '#fff', color: '#9a7d5a', fontSize: 11, cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
