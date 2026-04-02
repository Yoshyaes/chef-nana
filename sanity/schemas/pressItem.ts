import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'pressItem',
  title: 'Press / Publication',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Publication Name',
      type: 'string',
      description: 'e.g. "Bon Appétit", "The New York Times"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'href',
      title: 'Article URL',
      type: 'url',
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
    select: { title: 'name', subtitle: 'href' },
  },
})
