import { client } from './sanity'

export async function getEvents() {
  if (!client) return null
  return client.fetch<
    { date: string; location?: string; title: string; price?: string }[]
  >(`*[_type == "event"] | order(order asc) { date, location, title, price }`)
}

export async function getServices() {
  if (!client) return null
  return client.fetch<
    { title: string; description: string; linkText: string; href: string; order: number }[]
  >(
    `*[_type == "service"] | order(order asc) { title, description, linkText, href, order }`
  )
}

export async function getCredentials() {
  if (!client) return null
  return client.fetch<{ year: string; name: string }[]>(
    `*[_type == "credential"] | order(order asc) { year, name }`
  )
}

export async function getGalleryImages() {
  if (!client) return null
  return client.fetch<
    { image: unknown; alt: string; caption: string; position: string }[]
  >(
    `*[_type == "galleryImage"] | order(order asc) { image, alt, caption, position }`
  )
}

export async function getPressItems() {
  if (!client) return null
  return client.fetch<{ name: string; href: string }[]>(
    `*[_type == "pressItem"] | order(order asc) { name, href }`
  )
}

export async function getSiteSettings() {
  if (!client) return null
  return client.fetch<{
    heroTagline?: string
    quote?: string
    bioParagraph1?: string
    bioParagraph2?: string
    supperClubDescription?: string
  } | null>(`*[_type == "siteSettings"][0]`)
}
