import Link from 'next/link'

interface Asset { path: string; type: string; uploadedAt: string; signedUrl?: string | null }
interface Dish { name: string; description: string; dietary: string[]; allergens: string[] }
interface Course { name: string; dishes: Dish[] }

interface Menu {
  id: string
  title: string
  occasion: string[]
  cuisine: string[]
  season: string | null
  guest_min: number | null
  guest_max: number | null
  courses: Course[]
  source_photos: Asset[]
  status: 'draft' | 'active' | 'archived'
  last_used_at: string | null
  updated_at: string
}

const STATUS_STYLE: Record<string, { background: string; color: string }> = {
  draft: { background: '#fdf4e7', color: '#C9973A' },
  active: { background: '#e8f0ea', color: '#2D5F3D' },
  archived: { background: '#f0ece6', color: '#9a7d5a' },
}

function guestRange(min: number | null, max: number | null) {
  if (!min && !max) return null
  if (min && max) return `${min}${min !== max ? `-${max}` : ''} guests`
  if (min) return `${min}+ guests`
  return `Up to ${max} guests`
}

function occasionLabel(v: string) {
  return v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function MenuCard({ menu }: { menu: Menu }) {
  const thumbnail = menu.source_photos?.[0]?.signedUrl ?? null
  const badge = STATUS_STYLE[menu.status] ?? STATUS_STYLE.draft
  const range = guestRange(menu.guest_min, menu.guest_max)

  return (
    <Link href={`/admin/menus/${menu.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--cream)',
        border: '1px solid #e5d9c9',
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'box-shadow 0.15s',
        cursor: 'pointer',
      }}>
        {/* Thumbnail */}
        <div style={{
          height: 140,
          background: thumbnail ? 'transparent' : '#ede4d4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={menu.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: 32, opacity: 0.3 }}>◫</span>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 15,
              color: 'var(--brown)',
              fontWeight: 400,
              lineHeight: 1.3,
              flex: 1,
              marginRight: 8,
            }}>
              {menu.title}
            </div>
            <span style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 10,
              flexShrink: 0,
              fontWeight: 600,
              ...badge,
            }}>
              {menu.status}
            </span>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {menu.occasion.slice(0, 2).map(o => (
              <span key={o} style={{ fontSize: 10, background: '#f5ede0', color: '#7a6652', padding: '2px 7px', borderRadius: 6 }}>
                {occasionLabel(o)}
              </span>
            ))}
            {menu.cuisine.slice(0, 1).map(c => (
              <span key={c} style={{ fontSize: 10, background: '#f0ece6', color: '#9a7d5a', padding: '2px 7px', borderRadius: 6 }}>
                {c}
              </span>
            ))}
          </div>

          {/* Meta */}
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#9a7d5a' }}>
            {range && <span>{range}</span>}
            {menu.last_used_at && (
              <span>
                Used {new Date(menu.last_used_at).toLocaleDateString([], { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
