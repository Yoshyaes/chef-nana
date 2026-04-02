import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'galleryImage',
  title: 'Gallery Image',
  type: 'document',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alt Text',
      type: 'string',
      description: 'Describe the image for accessibility',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Short caption shown on hover',
    }),
    defineField({
      name: 'position',
      title: 'Image Position',
      type: 'string',
      options: {
        list: [
          { title: 'Center', value: 'object-center' },
          { title: 'Top', value: 'object-top' },
          { title: 'Bottom', value: 'object-bottom' },
        ],
      },
      initialValue: 'object-center',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
    }),
  ],
  orderings: [
    { title: 'Display Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'caption', media: 'image' },
  },
})
