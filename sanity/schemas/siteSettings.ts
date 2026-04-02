import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'heroTagline',
      title: 'Hero Tagline',
      type: 'text',
      rows: 2,
      description: 'The main tagline on the hero section',
    }),
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'string',
      description: 'The quote shown on the About section image',
    }),
    defineField({
      name: 'bioParagraph1',
      title: 'Bio — Paragraph 1',
      type: 'text',
      rows: 4,
      description: 'First paragraph of the Her Story section',
    }),
    defineField({
      name: 'bioParagraph2',
      title: 'Bio — Paragraph 2',
      type: 'text',
      rows: 4,
      description: 'Second paragraph of the Her Story section',
    }),
    defineField({
      name: 'supperClubDescription',
      title: 'Supper Club Description',
      type: 'text',
      rows: 4,
      description: 'Main description paragraph for the Love That I Knead section',
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Site Settings' }),
  },
})
