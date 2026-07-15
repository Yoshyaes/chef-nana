import type { ImageBlockParam, DocumentBlockParam } from '@anthropic-ai/sdk/resources/messages'
import { inngest } from '../client'
import { getAnthropicClient, updateMonthlySpend } from '@/lib/anthropic'
import { EXTRACT_MENU_PROMPT } from '@/lib/admin-prompts'
import { createServiceClient } from '@/lib/supabase/server'
import { downloadMenuPhotoBytes } from '@/lib/supabase/storage'

const MODEL = 'claude-sonnet-4-6'
const MAX_PHOTO_BYTES = 5 * 1024 * 1024

interface ExtractPhoto { path: string; type: string }

async function markError(extractionId: string, message: string) {
  const supabase = await createServiceClient()
  await supabase.from('menu_extractions').update({ status: 'error', error: message }).eq('id', extractionId)
}

export const extractMenuPhotos = inngest.createFunction(
  { id: 'extract-menu-photos', triggers: [{ event: 'menu/extract.requested' }] },
  async ({ event }: { event: { data: { extractionId: string; photos: ExtractPhoto[] } } }) => {
    const { extractionId, photos } = event.data
    const supabase = await createServiceClient()

    const anthropic = await getAnthropicClient()
    if (!anthropic) {
      await markError(extractionId, 'AI not configured. Add an Anthropic API key in Settings.')
      return { error: 'Anthropic not configured' }
    }

    const blocks: Array<ImageBlockParam | DocumentBlockParam> = []
    for (const photo of photos) {
      const buffer = await downloadMenuPhotoBytes(photo.path)
      if (!buffer) {
        await markError(extractionId, `Could not read ${photo.path.split('/').pop()}.`)
        return { error: 'Photo download failed' }
      }
      if (buffer.byteLength > MAX_PHOTO_BYTES) {
        await markError(extractionId, `${photo.path.split('/').pop()} is too large. Use a photo under 5MB.`)
        return { error: 'Photo too large' }
      }

      const data = buffer.toString('base64')
      if (photo.type === 'application/pdf') {
        blocks.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } })
      } else if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(photo.type)) {
        blocks.push({ type: 'image', source: { type: 'base64', media_type: photo.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif', data } })
      } else {
        await markError(extractionId, `Unsupported file type: ${photo.type}`)
        return { error: 'Unsupported file type' }
      }
    }

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: [...blocks, { type: 'text', text: EXTRACT_MENU_PROMPT }] }],
    })

    await updateMonthlySpend(response.usage.input_tokens, response.usage.output_tokens, 0, MODEL)

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    let parsed: { title?: string | null; courses?: unknown } = {}
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
    } catch { /* fall through to error below */ }

    if (!Array.isArray(parsed.courses)) {
      await markError(extractionId, 'Could not read this menu. Try a clearer photo or enter it manually.')
      return { error: 'Parse failed' }
    }

    await supabase.from('menu_extractions').update({
      status: 'done',
      result: { title: parsed.title ?? null, courses: parsed.courses },
    }).eq('id', extractionId)

    return { extractionId }
  }
)
