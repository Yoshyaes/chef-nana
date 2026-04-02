import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'credential',
  title: 'Credential / Achievement',
  type: 'document',
  fields: [
    defineField({
      name: 'year',
      title: 'Year',
      type: 'string',
      description: 'e.g. "2016 – 2019" or "2024"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'name',
      title: 'Achievement',
      type: 'text',
      rows: 2,
      description: 'Use a line break to separate the venue/award from the detail. HTML allowed (e.g. <br>, <em>).',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
    }),
  ],
  orderings: [
    { title: 'Display Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'name', subtitle: 'year' },
  },
})
