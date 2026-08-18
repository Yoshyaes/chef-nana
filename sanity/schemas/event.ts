import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'date',
      title: 'Date Display',
      type: 'string',
      description: 'e.g. "Apr 11 + 12" or "Apr 23 - 25"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'e.g. "Washington D.C." — leave blank if not applicable',
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'string',
      description: 'e.g. "$180" or "$185+" — leave blank if not applicable',
    }),
    defineField({
      name: 'ticketUrl',
      title: 'Get Tickets Link',
      type: 'string',
      description:
        'Where "Get Tickets" sends guests. Either a full external URL (a partner venue\'s own ticketing page) or an internal path to a native event page (e.g. "/events/bem-books-sep-9"). Leave blank to hide the ticket link for this row.',
    }),
    defineField({
      name: 'detail',
      title: 'Expanded Detail',
      type: 'text',
      description: 'Address/time detail shown when a guest expands this row, e.g. "Sunday 6:30–9:30PM, Maxwell Tribeca, 135 Watts St"',
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
    select: { title: 'title', subtitle: 'date' },
  },
})
