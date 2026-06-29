import { createServiceClient } from './server'

export async function getSignedMenuPhotoUrl(path: string): Promise<string | null> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase.storage
    .from('menu-photos')
    .createSignedUrl(path, 3600)
  if (error || !data) return null
  return data.signedUrl
}

export async function getSignedMenuPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (!paths.length) return {}
  const supabase = await createServiceClient()
  const { data, error } = await supabase.storage
    .from('menu-photos')
    .createSignedUrls(paths, 3600)
  if (error || !data) return {}
  const result: Record<string, string> = {}
  for (const item of data) {
    if (item.signedUrl) result[item.path] = item.signedUrl
  }
  return result
}
