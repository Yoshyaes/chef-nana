'use client'

import { useParams } from 'next/navigation'
import DraftsView from '@/components/admin/DraftsView'

export default function DraftDetailPage() {
  const { id } = useParams<{ id: string }>()
  return <DraftsView initialId={id} />
}
