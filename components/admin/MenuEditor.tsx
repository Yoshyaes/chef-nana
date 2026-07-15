'use client'

import { useState } from 'react'
import CourseDishRepeater from './CourseDishRepeater'
import PhotoUploader from './PhotoUploader'
import MenuPhotoExtractor from './MenuPhotoExtractor'

const OCCASIONS = ['private_dinner', 'catering', 'corporate', 'supper_club', 'holiday']
const CUISINES = ['Ghanaian', 'West African', 'Mediterranean', 'American', 'Pan-African', 'International']
const SEASONS = ['year_round', 'spring', 'summer', 'fall', 'winter']

function occasionLabel(v: string) {
  return v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function seasonLabel(v: string) {
  return v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

interface Asset { path: string; type: string; uploadedAt: string; signedUrl?: string | null }
interface Dish { name: string; description: string; dietary: string[]; allergens: string[] }
interface Course { name: string; dishes: Dish[] }

export interface MenuFormData {
  title: string
  occasion: string[]
  cuisine: string[]
  season: string
  guest_min: string
  guest_max: string
  notes: string
  courses: Course[]
  source_photos: Asset[]
  status: 'draft' | 'active' | 'archived'
}

interface Props {
  initialData?: Partial<MenuFormData>
  onSave: (data: MenuFormData) => Promise<void>
  onCancel: () => void
  saving?: boolean
}

export function defaultMenuForm(): MenuFormData {
  return {
    title: '',
    occasion: [],
    cuisine: [],
    season: '',
    guest_min: '',
    guest_max: '',
    notes: '',
    courses: [],
    source_photos: [],
    status: 'draft',
  }
}

function toggleArray(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
}

export default function MenuEditor({ initialData, onSave, onCancel, saving }: Props) {
  const [form, setForm] = useState<MenuFormData>(() => ({ ...defaultMenuForm(), ...initialData }))

  function set<K extends keyof MenuFormData>(key: K, value: MenuFormData[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    await onSave(form)
  }

  function handleExtracted({ title, courses }: { title: string | null; courses: Course[] }) {
    set('courses', form.courses.length === 0 ? courses : [...form.courses, ...courses])
    if (!form.title.trim() && title) set('title', title)
  }

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #e5d9c9',
    borderRadius: 8,
    fontSize: 13,
    color: 'var(--brown)',
    background: '#fff',
  }

  const labelStyle = {
    fontSize: 12,
    color: '#9a7d5a',
    display: 'block' as const,
    marginBottom: 5,
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Title + Status */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Title *</label>
          <input
            required
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Family-Style Ghanaian Dinner"
            style={inputStyle}
          />
        </div>
        <div style={{ width: 130 }}>
          <label style={labelStyle}>Status</label>
          <select
            value={form.status}
            onChange={e => set('status', e.target.value as MenuFormData['status'])}
            style={{ ...inputStyle, background: '#fff' }}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Occasion */}
      <div>
        <label style={labelStyle}>Occasion</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {OCCASIONS.map(o => (
            <label key={o} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              border: `1px solid ${form.occasion.includes(o) ? 'var(--gold)' : '#e5d9c9'}`,
              borderRadius: 20,
              background: form.occasion.includes(o) ? 'rgba(201,151,58,0.1)' : '#fff',
              cursor: 'pointer',
              fontSize: 12,
              color: form.occasion.includes(o) ? 'var(--brown)' : '#9a7d5a',
              userSelect: 'none',
            }}>
              <input
                type="checkbox"
                checked={form.occasion.includes(o)}
                onChange={() => set('occasion', toggleArray(form.occasion, o))}
                style={{ display: 'none' }}
              />
              {occasionLabel(o)}
            </label>
          ))}
        </div>
      </div>

      {/* Cuisine */}
      <div>
        <label style={labelStyle}>Cuisine</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CUISINES.map(c => (
            <label key={c} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              border: `1px solid ${form.cuisine.includes(c) ? 'var(--gold)' : '#e5d9c9'}`,
              borderRadius: 20,
              background: form.cuisine.includes(c) ? 'rgba(201,151,58,0.1)' : '#fff',
              cursor: 'pointer',
              fontSize: 12,
              color: form.cuisine.includes(c) ? 'var(--brown)' : '#9a7d5a',
              userSelect: 'none',
            }}>
              <input
                type="checkbox"
                checked={form.cuisine.includes(c)}
                onChange={() => set('cuisine', toggleArray(form.cuisine, c))}
                style={{ display: 'none' }}
              />
              {c}
            </label>
          ))}
        </div>
      </div>

      {/* Season + Guest range */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={labelStyle}>Season</label>
          <select
            value={form.season}
            onChange={e => set('season', e.target.value)}
            style={{ ...inputStyle, background: '#fff' }}
          >
            <option value="">Any season</option>
            {SEASONS.map(s => <option key={s} value={s}>{seasonLabel(s)}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 100 }}>
          <label style={labelStyle}>Min guests</label>
          <input
            type="number"
            min={1}
            value={form.guest_min}
            onChange={e => set('guest_min', e.target.value)}
            placeholder="e.g. 10"
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1, minWidth: 100 }}>
          <label style={labelStyle}>Max guests</label>
          <input
            type="number"
            min={1}
            value={form.guest_max}
            onChange={e => set('guest_max', e.target.value)}
            placeholder="e.g. 30"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label style={labelStyle}>Notes</label>
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Any context about this menu, client feedback, special requirements..."
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' as const, fontFamily: 'inherit' }}
        />
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #eee5d7' }} />

      {/* Photos */}
      <PhotoUploader
        photos={form.source_photos}
        onChange={photos => set('source_photos', photos)}
      />

      <MenuPhotoExtractor
        photos={form.source_photos}
        onExtracted={handleExtracted}
      />

      {/* Divider */}
      <div style={{ borderTop: '1px solid #eee5d7' }} />

      {/* Courses */}
      <CourseDishRepeater
        courses={form.courses}
        onChange={courses => set('courses', courses)}
      />

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            border: '1px solid #e5d9c9',
            borderRadius: 8,
            background: '#fff',
            color: '#9a7d5a',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '10px 24px',
            background: 'var(--gold)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save menu'}
        </button>
      </div>
    </form>
  )
}
