import { createClient } from 'next-sanity'
import { createImageUrlBuilder } from '@sanity/image-url'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SanityImageSource = any

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ''
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = '2024-01-01'

export const client = projectId
  ? createClient({ projectId, dataset, apiVersion, useCdn: true })
  : null

const builder = projectId
  ? createImageUrlBuilder({ projectId, dataset })
  : null

export function urlFor(source: SanityImageSource) {
  if (!builder) return { width: () => ({ url: () => '' }) }
  return builder.image(source)
}
