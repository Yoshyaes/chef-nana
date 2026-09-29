import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { isLikelyBot } from '@/lib/bot-detection'

const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID

// Maps the `eventSlug` a waitlist form posts to the property value stored on
// the Resend contact — Resend contacts don't support free-text tags, so a
// custom property is the closest equivalent.
const WAITLIST_TAGS: Record<string, string> = {
  'nov-13-popup': '11/13-pop-up-waitlist',
}

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not configured')
  return new Resend(key)
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  if (isLikelyBot(req.headers.get('user-agent'))) {
    return NextResponse.json({ success: false, message: 'Unavailable.' }, { status: 400 })
  }

  try {
    const body = await req.json()
    const { email, eventSlug } = body

    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'A valid email address is required.' },
        { status: 400 }
      )
    }

    if (!eventSlug || typeof eventSlug !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Missing event.' },
        { status: 400 }
      )
    }

    const tag = WAITLIST_TAGS[eventSlug] ?? eventSlug

    if (!RESEND_AUDIENCE_ID) {
      return NextResponse.json({ success: true })
    }

    const resend = getResend()

    // Same audience as the general newsletter signup — this both adds the
    // waitlist signup to the newsletter list and tags them for this event.
    // Resend's create() 400s if the contact already exists in the audience,
    // so fall back to update() to make sure the tag still lands.
    const created = await resend.contacts.create({
      audienceId: RESEND_AUDIENCE_ID,
      email,
      properties: { waitlist_tag: tag },
    })

    if (created.error) {
      await resend.contacts.update({
        audienceId: RESEND_AUDIENCE_ID,
        email,
        properties: { waitlist_tag: tag },
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
