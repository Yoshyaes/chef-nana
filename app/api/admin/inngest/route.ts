import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { researchLead, generateDraft, dailyTriage } from '@/inngest/functions'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [researchLead, generateDraft, dailyTriage],
})
