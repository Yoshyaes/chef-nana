import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'yp04xm8i',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
})

const events = [
  { _type: 'event', title: 'Homecoming: The Taste of Return', date: 'Apr 11 + 12', location: 'Washington D.C.', price: '$180', order: 1 },
  { _type: 'event', title: 'Black Women In Food Summit Panelist', date: 'Apr 23 - 25', location: 'Washington D.C.', order: 2 },
  { _type: 'event', title: 'Meals On Wheels Celebrity Brunch', date: 'Apr 26', location: 'Philadelphia, PA', order: 3 },
]

const services = [
  { _type: 'service', title: 'Private Chef & Dining', description: 'Intimate dinners for 2, milestone celebrations for 50. Fully custom menus rooted in West African tradition with fine-dining precision.', linkText: 'Inquire →', href: '#booking', order: 1 },
  { _type: 'service', title: 'Travel Chef', description: 'New York · Philadelphia · Accra. Nana brings her kitchen to you — wherever you are. Available for destination events and residential residencies.', linkText: 'Inquire →', href: '#booking', order: 2 },
  { _type: 'service', title: 'Love That I Knead Supper Club', description: 'Ticketed West African-inspired dinner experiences. Intimate, communal, and soulful — from Brooklyn lofts to Accra terraces.', linkText: 'See Upcoming Dates →', href: '#supper', order: 3 },
  { _type: 'service', title: 'Menu Consulting & Education', description: 'Menu development, culinary education, and cooking experiences for restaurants, institutions, and private clients seeking cultural depth.', linkText: 'Inquire →', href: '#booking', order: 4 },
  { _type: 'service', title: 'Shop (Coming Soon)', description: 'Sauces, spice blends, and culinary products bringing West African pantry essentials to your home kitchen.', linkText: 'Join the Waitlist →', href: '#newsletter', order: 5 },
]

const credentials = [
  { _type: 'credential', year: '2016 – 2019', name: 'Le Coucou, NYC<br>Michelin Star · James Beard', order: 1 },
  { _type: 'credential', year: '2023', name: 'Culinarian Award<br>Black Women in Food', order: 2 },
  { _type: 'credential', year: '2024', name: '<em>The Contemporary African Kitchen</em><br>Contributor', order: 3 },
  { _type: 'credential', year: '2026', name: 'Top Chef Season 23<br>Bravo · Now Airing', order: 4 },
]

const pressItems = [
  { _type: 'pressItem', name: 'Bon Appétit', href: 'https://www.bonappetit.com/story/line-cook-nycs-fanciest-restaurants?srsltid=AfmBOooa_tBf1KIhihGltwR7Jv8MLSBXOow92v-QGn3B7HOslZKkJ74w', order: 1 },
  { _type: 'pressItem', name: 'The New York Times', href: 'https://www.nytimes.com/2021/01/11/dining/black-women-fine-dining-restaurant-kitchens.html', order: 2 },
  { _type: 'pressItem', name: 'Forbes', href: 'https://www.forbes.com/sites/andywang/2023/07/27/james-beard-foundations-platform-celebrates-black-culinary-excellence/', order: 3 },
  { _type: 'pressItem', name: 'Eater', href: 'https://www.eater.com/23617676/west-african-fine-dining-restaurants-in-america', order: 4 },
  { _type: 'pressItem', name: 'Cherry Bombe', href: 'https://cherrybombe.com/blogs/radio-cherry-bombe/chefs-nana-wilmot-and-lana-lagomarsini-are-redefining-fine-dining', order: 5 },
  { _type: 'pressItem', name: 'Bravo · Top Chef S23', href: 'https://www.bravotv.com/people/nana-araba-wilmot', order: 6 },
]

const siteSettings = {
  _type: 'siteSettings',
  _id: 'siteSettings',
  heroTagline: 'Michelin-trained private chef reimagining West African heritage cuisine for the modern table. Private dining, catering, and supper clubs across three continents.',
  quote: 'I always do it for the culture.',
  bioParagraph1: 'Nana Araba Wilmot grew up in Cherry Hill, New Jersey — but her culinary roots reach back to the kitchens of Accra, Ghana. After graduating from the Art Institute of Philadelphia, she trained under Iron Chef José Garcés and went on to cook at Daniel Rose\u2019s Le Coucou — helping earn its Michelin Star and James Beard Award.',
  bioParagraph2: 'During the pandemic, Nana returned to Cherry Hill and launched Love That I Knead from her backyard — an intimate supper club rooted in West African foodways. Today, she operates Georgina\u2019s Private Chef & Catering Co. across New York, Philadelphia, and Accra.',
  supperClubDescription: 'An intimate supper club series celebrating the foodways of West Africa and beyond reimagined through a fine-dining lens and served around a communal table. Each dinner is a four to five course journey through history, memory, and flavor.',
}

async function seed() {
  console.log('Seeding Sanity...')

  // Create all documents
  const tx = client.transaction()

  tx.createOrReplace(siteSettings)
  for (const doc of [...events, ...services, ...credentials, ...pressItems]) {
    tx.create(doc)
  }

  await tx.commit()
  console.log('Done! Seeded all content.')
}

seed().catch(console.error)
