import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'linkText',
      title: 'Link Text',
      type: 'string',
      description: 'e.g. "Inquire →" or "See Upcoming Dates →"',
      initialValue: 'Inquire →',
    }),
    defineField({
      name: 'href',
      title: 'Link Target',
      type: 'string',
      description: 'e.g. "#booking" or "#supper"',
      initialValue: '#booking',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first. The number shown on the card is auto-generated.',
      validation: (r) => r.required(),
    }),
  ],
  orderings: [
    { title: 'Display Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'title', subtitle: 'description' },
  },
})
