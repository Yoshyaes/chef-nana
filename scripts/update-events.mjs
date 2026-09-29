import { createClient } from '@sanity/client'

const client = createClient({
  projectId: '8novxdzx',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
})

// Published past events to remove (Sep 12 x2, Sep 25 — all before today).
const PAST_EVENT_IDS = [
  'GQfTeaSNUgXnSPizpNc4dO', // Love That I Knead at BEM Books & More - 2:00 PM Service (Sep 12)
  'x1Wy5Cg0foUhPMHO95kCSP', // Love That I Knead at BEM Books & More — 5:30 PM Service (Sep 12)
  'nInhSMWoZN74ApPFGDe9EG', // James Beard Foundation Collab Dinner with Chef Andrew Black (Sep 25)
]

const PLACEHOLDER_NOTE =
  'PLACEHOLDER — confirm the exact event name, price, and ticket link with Nana before publishing this row.'

// New events, in display order. 10/6 has every detail confirmed, so it's
// created as a normal (published) document. 11/1, 11/6, and 11/13 are
// missing confirmed details (price, and for 11/13 the name/location too),
// so they're created as Sanity Studio drafts — invisible on the live site
// (lib/sanity.ts reads with no auth token, so drafts never resolve) until
// someone reviews and publishes them from Studio.
const publishedEvents = [
  {
    _type: 'event',
    title: "Cookies for Kids' Cancer Benefit",
    date: 'Oct 6',
    location: 'Charlotte, NC',
    ctaType: 'donate',
    donateUrl:
      'https://my.onecause.com/event/organizations/sf-001C000001TG1f6IAD/events/vevt:b8babe0e-61a5-4e6a-9221-e460e586a2a0/home/story',
    order: 1,
  },
]

const draftEvents = [
  {
    _id: 'drafts.event-2026-11-01-maxwell-social-redo',
    _type: 'event',
    title: 'Love That I Knead at Maxwell Social (Redo)',
    date: 'Nov 1',
    location: 'New York, NY',
    ctaType: 'tickets',
    detail: PLACEHOLDER_NOTE,
    order: 2,
  },
  {
    _id: 'drafts.event-2026-11-06-vetri-foundation',
    _type: 'event',
    title: 'Vetri Foundation Cooking Class Fundraiser',
    date: 'Nov 6',
    location: 'Philadelphia, PA',
    ctaType: 'tickets',
    detail: PLACEHOLDER_NOTE,
    order: 3,
  },
  {
    _id: 'drafts.event-2026-11-13-popup',
    _type: 'event',
    title: 'Love That I Knead Pop-Up (Name TBD)',
    date: 'Nov 13',
    location: 'TBD',
    ctaType: 'waitlist',
    waitlistEventSlug: 'nov-13-popup',
    detail: PLACEHOLDER_NOTE,
    order: 4,
  },
]

async function run() {
  console.log('Removing past events...')
  for (const id of PAST_EVENT_IDS) {
    await client.delete(id)
    console.log(`Deleted ${id}`)
  }

  console.log('Creating confirmed (published) events...')
  for (const doc of publishedEvents) {
    const created = await client.create(doc)
    console.log(`Created ${created._id} — ${doc.title}`)
  }

  console.log('Creating placeholder (draft) events...')
  for (const doc of draftEvents) {
    const created = await client.createOrReplace(doc)
    console.log(`Created ${created._id} — ${doc.title}`)
  }

  console.log('Done.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
