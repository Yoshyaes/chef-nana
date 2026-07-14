'use client'
import { useEffect, useState } from 'react'

export interface CurrentProfile {
  id: string
  full_name: string
  role: 'admin' | 'manager' | 'owner'
  avatar_color: string
}

export function useCurrentProfile() {
  const [profile, setProfile] = useState<CurrentProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/me')
      .then(r => r.ok ? r.json() : null)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [])

  return { profile, loading }
}
