import { createServiceClient } from './supabase/server'

interface ApolloSearchParams {
  query: string
  titles?: string[]
  locations?: string[]
  limit?: number
}

interface ApolloContact {
  name: string
  title: string
  organization: string
  email: string | null
  linkedin_url: string | null
  city: string | null
  state: string | null
  raw: Record<string, unknown>
}

async function getApolloKey(): Promise<string | null> {
  try {
    const supabase = await createServiceClient()
    const { data } = await supabase
      .from('settings')
      .select('apollo_api_key_encrypted')
      .single()
    return data?.apollo_api_key_encrypted ?? null
  } catch {
    return null
  }
}

export async function searchApollo(params: ApolloSearchParams): Promise<ApolloContact[]> {
  const apiKey = await getApolloKey()
  if (!apiKey) throw new Error('Apollo API key not configured')

  const body = {
    q_keywords: params.query,
    page: 1,
    per_page: params.limit ?? 25,
    person_titles: params.titles ?? [],
    person_locations: params.locations ?? [],
  }

  const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`Apollo error: ${res.status}`)

  const json = await res.json()
  const people = json.people ?? []

  return people.map((p: Record<string, unknown>) => ({
    name: p.name as string,
    title: (p.title as string) ?? '',
    organization: ((p.organization as Record<string, unknown>)?.name as string) ?? '',
    email: (p.email as string | null) ?? null,
    linkedin_url: (p.linkedin_url as string | null) ?? null,
    city: (p.city as string | null) ?? null,
    state: (p.state as string | null) ?? null,
    raw: p,
  }))
}

export async function enrichContact(email: string): Promise<Record<string, unknown> | null> {
  const apiKey = await getApolloKey()
  if (!apiKey) return null

  const res = await fetch('https://api.apollo.io/v1/people/match', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify({ email }),
  })

  if (!res.ok) return null
  const json = await res.json()
  return json.person ?? null
}
