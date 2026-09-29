import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fitlerDir = path.join(__dirname, '..', 'fitler')

const client = createClient({
  projectId: '8novxdzx',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
})

const EVENT_NAME = 'Fitler Supper Club'

// order 1–5 are the curated set shown in the homepage mosaic (Gallery.tsx
// slices to the first 5, by `order`); the full set groups under EVENT_NAME
// on /gallery.
const photos = [
  { file: 'IMG_7311.JPG', order: 1, caption: 'Golden Hour at the Table', alt: 'Guest smiling in golden light at the Fitler Supper Club dinner table', position: 'object-top' },
  { file: 'IMG_7304.JPG', order: 2, caption: 'Chef Nana Plating the Whole Fish', alt: 'Chef Nana spooning sauce over a whole grilled fish plate', position: 'object-center' },
  { file: 'IMG_7307.JPG', order: 3, caption: 'Chef Nana with Guests', alt: 'Chef Nana laughing with guests at the rooftop dinner', position: 'object-center' },
  { file: 'IMG_7305.JPG', order: 4, caption: 'West African-Spiced Chicken', alt: 'West African-spiced chicken dish garnished with microgreens', position: 'object-center' },
  { file: 'IMG_7314.JPG', order: 5, caption: 'The Room in Applause', alt: 'The dining room applauding Chef Nana at the Fitler Supper Club', position: 'object-center' },
  { file: 'IMG_7299.JPG', order: 6, caption: 'Chef Nana Greeting Guests', alt: 'Chef Nana greeting guests in the dining room', position: 'object-top' },
  { file: 'IMG_7302.JPG', order: 7, caption: 'The Communal Table', alt: 'Guests in colorful prints seated at the communal table', position: 'object-center' },
  { file: 'IMG_7303.JPG', order: 8, caption: 'Plating the Fish Course', alt: 'Chef Nana and a cook plating fish dishes in the kitchen', position: 'object-center' },
  { file: 'IMG_7306.JPG', order: 9, caption: 'Caramel-Drizzled Cake', alt: 'Caramel sauce drizzled over a slice of cake', position: 'object-center' },
  { file: 'IMG_7308.JPG', order: 10, caption: 'A Toast Among Friends', alt: 'Guests laughing and shaking hands at the dinner', position: 'object-center' },
  { file: 'IMG_7309.JPG', order: 11, caption: 'Applause at the Table', alt: 'Guests applauding at the long dinner table', position: 'object-center' },
  { file: 'IMG_7310.JPG', order: 12, caption: 'Chef Nana at the Window', alt: 'Chef Nana chatting with guests by the window at night', position: 'object-top' },
  { file: 'IMG_7313.JPG', order: 13, caption: 'Tasting the Crispy Greens', alt: 'A guest tasting crispy fried greens', position: 'object-top' },
]

async function seed() {
  console.log(`Uploading ${photos.length} photos from ${fitlerDir}...`)

  for (const photo of photos) {
    const filePath = path.join(fitlerDir, photo.file)
    const buffer = fs.readFileSync(filePath)

    const asset = await client.assets.upload('image', buffer, { filename: photo.file })
    console.log(`Uploaded ${photo.file} -> ${asset._id}`)

    await client.create({
      _type: 'galleryImage',
      image: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
      alt: photo.alt,
      caption: photo.caption,
      position: photo.position,
      order: photo.order,
      eventName: EVENT_NAME,
    })
    console.log(`Created galleryImage doc for ${photo.file}`)
  }

  console.log('Done.')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
