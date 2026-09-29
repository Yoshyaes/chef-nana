import { createClient } from '@sanity/client'

const client = createClient({
  projectId: '8novxdzx',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
})

const DRAFT_ID = 'drafts.event-2026-11-13-popup'
const PUBLISHED_ID = 'event-2026-11-13-popup'

async function run() {
  const draft = await client.getDocument(DRAFT_ID)
  if (!draft) {
    throw new Error(`Draft ${DRAFT_ID} not found`)
  }

  const { _id, _rev, ...rest } = draft
  void _id
  void _rev

  await client.createOrReplace({
    _id: PUBLISHED_ID,
    ...rest,
    location: 'Location TBD',
    detail: 'This is a placeholder event for testing the waitlist button/modal — the real pop-up name, location, and price are still being confirmed.',
  })
  console.log(`Published ${PUBLISHED_ID}`)

  await client.delete(DRAFT_ID)
  console.log(`Deleted draft ${DRAFT_ID}`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
