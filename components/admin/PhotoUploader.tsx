'use client'

import { useRef, useState } from 'react'

interface Asset {
  path: string
  type: string
  uploadedAt: string
  signedUrl?: string | null
}

interface UploadingFile {
  id: string
  name: string
  previewUrl: string | null
  type: string
  status: 'uploading' | 'done' | 'error'
  errorMsg?: string
}

interface Props {
  photos: Asset[]
  onChange: (photos: Asset[]) => void
}

function fileId() {
  return Math.random().toString(36).slice(2)
}

export default function PhotoUploader({ photos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<UploadingFile[]>([])
  const [dragging, setDragging] = useState(false)

  async function uploadFile(file: File) {
    const id = fileId()
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null

    setUploading(prev => [...prev, { id, name: file.name, previewUrl, type: file.type, status: 'uploading' }])

    const formData = new FormData()
    formData.set('file', file)

    try {
      const res = await fetch('/api/admin/menus/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }))
        setUploading(prev => prev.map(u => u.id === id ? { ...u, status: 'error', errorMsg: err.error } : u))
        return
      }
      const asset: Asset = await res.json()
      asset.signedUrl = previewUrl
      onChange([...photos, asset])
      setUploading(prev => prev.map(u => u.id === id ? { ...u, status: 'done' } : u))
      setTimeout(() => setUploading(prev => prev.filter(u => u.id !== id)), 2000)
    } catch {
      setUploading(prev => prev.map(u => u.id === id ? { ...u, status: 'error', errorMsg: 'Network error' } : u))
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return
    for (const file of Array.from(files)) {
      uploadFile(file)
    }
  }

  function removePhoto(path: string) {
    onChange(photos.filter(p => p.path !== path))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div>
      <div style={{ fontSize: 11, color: '#9a7d5a', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
        Source photos
      </div>

      {/* Existing photos */}
      {photos.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {photos.map(photo => (
            <div key={photo.path} style={{ position: 'relative', width: 80, height: 80 }}>
              {photo.type.startsWith('image/') && photo.signedUrl ? (
                <img
                  src={photo.signedUrl}
                  alt="Menu photo"
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5d9c9' }}
                />
              ) : (
                <div style={{
                  width: 80, height: 80, borderRadius: 8, border: '1px solid #e5d9c9',
                  background: '#f5ede0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24,
                }}>
                  📄
                </div>
              )}
              <button
                type="button"
                onClick={() => removePhoto(photo.path)}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#B85A35',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 11,
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {/* In-progress uploads */}
      {uploading.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {uploading.map(u => (
            <div key={u.id} style={{ position: 'relative', width: 80, height: 80 }}>
              {u.previewUrl ? (
                <img
                  src={u.previewUrl}
                  alt={u.name}
                  style={{
                    width: 80, height: 80, objectFit: 'cover', borderRadius: 8,
                    border: '1px solid #e5d9c9',
                    opacity: u.status === 'uploading' ? 0.5 : 1,
                  }}
                />
              ) : (
                <div style={{
                  width: 80, height: 80, borderRadius: 8, border: '1px solid #e5d9c9',
                  background: '#f5ede0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, opacity: u.status === 'uploading' ? 0.5 : 1,
                }}>
                  📄
                </div>
              )}
              {u.status === 'uploading' && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.5)',
                  fontSize: 18,
                }}>
                  ⟳
                </div>
              )}
              {u.status === 'error' && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: '#B85A35', color: '#fff', fontSize: 9,
                  padding: '2px 4px', borderRadius: '0 0 8px 8px', textAlign: 'center',
                }}>
                  Error
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--gold)' : '#e5d9c9'}`,
          borderRadius: 10,
          padding: '20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? 'rgba(201,151,58,0.05)' : '#faf7f3',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <div style={{ fontSize: 20, marginBottom: 6, opacity: 0.4 }}>+</div>
        <div style={{ fontSize: 13, color: '#9a7d5a' }}>
          Drag photos or PDFs here, or click to select
        </div>
        <div style={{ fontSize: 11, color: '#b0a090', marginTop: 4 }}>
          JPG, PNG, WebP, PDF
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
        style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  )
}
