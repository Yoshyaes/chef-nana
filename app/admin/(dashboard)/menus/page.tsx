import { Suspense } from 'react'
import Link from 'next/link'
import MenuCard from '@/components/admin/MenuCard'
import MenuFilters from '@/components/admin/MenuFilters'
import { createServiceClient } from '@/lib/supabase/server'
import { getSignedMenuPhotoUrls } from '@/lib/supabase/storage'

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

async function getMenus(params: Record<string, string>): Promise<Menu[]> {
  const supabase = await createServiceClient()
  const { q, occasion, cuisine, status, guests } = params

  let query = supabase
    .from('menus')
    .select('*')
    .order('updated_at', { ascending: false })

  if (q) {
    query = query.textSearch('search_tsv', q, { type: 'plain', config: 'english' })
  }
  if (occasion) {
    query = query.overlaps('occasion', [occasion])
  }
  if (cuisine) {
    query = query.overlaps('cuisine', [cuisine])
  }
  if (status === 'archived') {
    query = query.eq('status', 'archived')
  } else if (status) {
    query = query.eq('status', status)
  } else {
    query = query.in('status', ['draft', 'active'])
  }
  if (guests) {
    const g = parseInt(guests, 10)
    if (!isNaN(g)) {
      query = query
        .or(`guest_min.is.null,guest_min.lte.${g}`)
        .or(`guest_max.is.null,guest_max.gte.${g}`)
    }
  }

  const { data } = await query
  const menus: Menu[] = (data ?? []) as Menu[]

  // Resolve signed URLs for first photo thumbnails
  const thumbnailPaths = menus
    .map(m => m.source_photos?.[0]?.path)
    .filter((p): p is string => Boolean(p))

  if (thumbnailPaths.length > 0) {
    const signedUrls = await getSignedMenuPhotoUrls(thumbnailPaths)
    for (const menu of menus) {
      const firstPhoto = menu.source_photos?.[0]
      if (firstPhoto) {
        firstPhoto.signedUrl = signedUrls[firstPhoto.path] ?? null
      }
    }
  }

  return menus
}

export default async function MenusPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const menus = await getMenus(params)

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--brown)', fontWeight: 400 }}>
          Menus ({menus.length})
        </h1>
        <Link href="/admin/menus/new" style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '9px 18px',
            background: 'var(--gold)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}>
            + New menu
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 24 }}>
        <Suspense fallback={null}>
          <MenuFilters />
        </Suspense>
      </div>

      {/* Grid */}
      {menus.length === 0 ? (
        <div style={{
          background: 'var(--cream)',
          border: '1px dashed #e5d9c9',
          borderRadius: 16,
          padding: '64px 32px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 16, opacity: 0.3 }}>◫</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--brown)', marginBottom: 8 }}>
            No menus yet
          </div>
          <div style={{ fontSize: 14, color: '#9a7d5a', marginBottom: 24 }}>
            Add your first menu to start building the library.
          </div>
          <Link href="/admin/menus/new" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '10px 20px',
              background: 'var(--gold)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}>
              Add first menu
            </button>
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
        }}>
          {menus.map(menu => (
            <MenuCard key={menu.id} menu={menu} />
          ))}
        </div>
      )}
    </div>
  )
}
